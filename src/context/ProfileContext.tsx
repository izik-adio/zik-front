import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { UserProfile, UserPreferences, CreateProfileRequest, UpdateProfileRequest } from '../types/api';
import { profileApi, ProfileApiError } from '../api/profile';
import { useAuth } from './AuthContext';
import { storage } from '../utils/storage';

// Cache configuration
const PROFILE_CACHE_KEY = 'userProfile';
const PROFILE_CACHE_EXPIRY_KEY = 'userProfileExpiry';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface CachedProfile {
    profile: UserProfile;
    timestamp: number;
}

interface ProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    validationErrors: Record<string, string>;
    profileExists: boolean;
    onboardingCompleted: boolean;

    // Actions
    fetchProfile: () => Promise<UserProfile | null>;
    refreshProfile: () => Promise<void>;
    updateProfile: (data: UpdateProfileRequest) => Promise<UserProfile | null>;
    updatePreferences: (preferences: Partial<UserPreferences>) => Promise<UserProfile | null>;
    completeOnboarding: () => Promise<boolean>;
    clearError: () => void;
    validateProfile: (data: CreateProfileRequest | UpdateProfileRequest) => boolean;

    // Profile creation (for new users)
    needsProfileCreation: boolean;
    setProfileCreated: (profile: UserProfile) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};

interface ProfileProviderProps {
    children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [profileExists, setProfileExists] = useState(false);
    const [needsProfileCreation, setNeedsProfileCreation] = useState(false);

    const { isAuthenticated, user } = useAuth();

    // Computed values
    const onboardingCompleted = profile?.onboardingCompleted ?? false;

    // Debug logging function
    const logProfileState = (prefix: string) => {
      console.log(`${prefix} Profile State:`, {
        hasProfile: !!profile,
        profileId: profile?.userId,
        loading,
        error,
        needsProfileCreation,
        profileExists,
        onboardingCompleted: profile?.onboardingCompleted,
        isAuthenticated,
        hasUser: !!user,
      });
    };
    // Cache utility functions
    const getCachedProfile = async (): Promise<UserProfile | null> => {
        try {
            const cachedData = await storage.getItem<CachedProfile>(PROFILE_CACHE_KEY);
            if (cachedData && cachedData.profile && cachedData.timestamp) {
                const isExpired = Date.now() - cachedData.timestamp > CACHE_DURATION;
                if (!isExpired) {
                    console.log('📦 Using cached profile data');
                    return cachedData.profile;
                }
                console.log('⏰ Profile cache expired, removing...');
                await clearProfileCache();
            }
        } catch (error) {
            console.error('Error reading profile cache:', error);
        }
        return null;
    };

    const setCachedProfile = async (profile: UserProfile): Promise<void> => {
        try {
            const cachedData: CachedProfile = {
                profile,
                timestamp: Date.now()
            };
            await storage.setItem(PROFILE_CACHE_KEY, cachedData);
            console.log('💾 Profile cached successfully');
        } catch (error) {
            console.error('Error caching profile:', error);
        }
    };

    const clearProfileCache = async (): Promise<void> => {
        try {
            await storage.removeItem(PROFILE_CACHE_KEY);
            await storage.removeItem(PROFILE_CACHE_EXPIRY_KEY);
            console.log('🗑️ Profile cache cleared');
        } catch (error) {
            console.error('Error clearing profile cache:', error);
        }
    };

    useEffect(() => {
        logProfileState('Auth State Changed:');
        if (isAuthenticated && user) {
            // Only fetch profile if we don't already have one and aren't in the middle of creating one
            if (!profile && !loading && !needsProfileCreation) {
                fetchProfile();
            }
        } else {
            // Clear profile state when user logs out
            setProfile(null);
            setProfileExists(false);
            setNeedsProfileCreation(false);
            setError(null);
            setValidationErrors({});
            // Clear profile cache when user logs out
            clearProfileCache();
        }
    }, [isAuthenticated, user]);

    // Improved error handling function
    const handleProfileError = useCallback((error: any, operation: string): string => {
      console.error(`Error during ${operation}:`, error);
      
      if (error instanceof ProfileApiError) {
        if (error.status === 401) {
          // Auth error - will be handled by AuthContext
          return 'Authentication required';
        } else if (error.status === 404) {
          // Not found - specific handling
          setProfileExists(false);
          setNeedsProfileCreation(true);
          return 'Profile not found';
        } else {
          // Other API errors
          return `API Error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        // Generic errors
        return `Error: ${error.message}`;
      }
      
      // Unknown errors
      return 'An unknown error occurred';
    }, []);
    const fetchProfile = async (): Promise<UserProfile | null> => {
        if (!isAuthenticated) {
            console.log('fetchProfile: Not authenticated, returning null');
            return null;
        }

        logProfileState('Before fetchProfile:');
        setLoading(true);
        setError(null);

        // Check cache first
        const cachedProfile = await getCachedProfile();

        if (cachedProfile) {
            // Valid cached profile found
            setProfile(cachedProfile);
            setProfileExists(true);
            setNeedsProfileCreation(false);
            setLoading(false);
            logProfileState('After fetchProfile (from cache):');
            return cachedProfile;
        }

        try {
            console.log('Fetching profile from API...');
            const profileData = await profileApi.getProfileWithRetry();
            console.log('Profile API response:', profileData ? 'Profile found' : 'No profile found');

            if (profileData) {
                setProfile(profileData);
                setProfileExists(true);
                setNeedsProfileCreation(false);

                // Update cache
                await setCachedProfile(profileData);
                logProfileState('After fetchProfile (from API):');
            } else {
                // Profile doesn't exist, user needs to create one
                setProfile(null);
                setProfileExists(false);
                setNeedsProfileCreation(true);
                logProfileState('After fetchProfile (no profile):');
            }

            return profileData;
        } catch (error) {
            console.error('Error in fetchProfile:', error);
            
            // Handle 401 errors silently - let AuthContext handle the logout
            if (error instanceof ProfileApiError && error.status === 401) {
                console.log('401 error in fetchProfile - letting AuthContext handle logout');
                // Don't set error state for auth errors - AuthContext will handle logout
                return null;
            }
            
            // For all other errors, we should set needsProfileCreation to true
            // This ensures the user can proceed with profile creation
            setProfile(null);
            setProfileExists(false);
            setNeedsProfileCreation(true);
            
            const errorMessage = handleProfileError(error, 'profile fetch');
            setError(errorMessage);
            logProfileState('After fetchProfile (error):');

            return null;
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async (): Promise<void> => {
        // Prevent refreshing if already loading
        if (loading) {
            console.log('Skipping profile refresh - already loading');
            return;
        }
        
        console.log('Forcing profile refresh...');
        // Clear cache before fetching to ensure fresh data
        await clearProfileCache();
        setLoading(true);
        setError(null);
        
        try {
            const response = await api.get('/profile');
            
            // Parse response according to backend structure
            let profileData: UserProfile | null = null;
            
            if (response.data?.data?.profile) {
                // New backend structure
                profileData = response.data.data.profile;
            } else if (response.data?.profile) {
                // Legacy structure
                profileData = response.data.profile;
            } else {
                throw new ProfileApiError(404, 'Profile not found in response');
            }
            
            setProfile(profileData);
            setProfileExists(true);
            setNeedsProfileCreation(false);
            
            // Update cache with fresh data
            await setCachedProfile(profileData);
            logProfileState('After refreshProfile (success):');
        } catch (error) {
            const errorMessage = handleProfileError(error, 'profile refresh');
            setError(errorMessage);
            logProfileState('After refreshProfile (error):');
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<UserProfile | null> => {
        // Validate before sending
        const validation = profileApi.validateProfile(data);
        setValidationErrors(validation.errors);

        if (!validation.isValid) {
            setError('Please fix the validation errors below');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const updatedProfile = await profileApi.updateProfile(data);
            setProfile(updatedProfile);

            // Update cache
            await setCachedProfile(updatedProfile);

            return updatedProfile;
        } catch (error) {
            const errorMessage = handleProfileError(error, 'profile update');
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>): Promise<UserProfile | null> => {
        if (!profile) {
            setError('No profile loaded');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const updatedProfile = await profileApi.updatePreferences(preferences);
            setProfile(updatedProfile);
            return updatedProfile;
        } catch (error) {
            const errorMessage = handleProfileError(error, 'preferences update');
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [profile]);

    const completeOnboarding = async (): Promise<boolean> => {
        if (!profile) {
            setError('No profile loaded');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            await profileApi.completeOnboarding();

            // Update local state
            setProfile({
                ...profile,
                onboardingCompleted: true,
            });

            // Update cache
            await setCachedProfile({ ...profile, onboardingCompleted: true });

            return true;
        } catch (error) {
            const errorMessage = handleProfileError(error, 'onboarding completion');
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const clearError = useCallback((): void => {
        setError(null);
        setValidationErrors({});
    }, []);

    const validateProfile = useCallback((data: CreateProfileRequest | UpdateProfileRequest): boolean => {
        const validation = profileApi.validateProfile(data);
        setValidationErrors(validation.errors);
        return validation.isValid;
    }, []);

    const setProfileCreated = useCallback((newProfile: UserProfile): void => {
        setProfile(newProfile);
        setProfileExists(true);
        setNeedsProfileCreation(false);
        setError(null);
        setValidationErrors({});
        // Also update the cache
        setCachedProfile(newProfile);
        logProfileState('After setProfileCreated:');
    }, []);

    const value: ProfileContextType = {
        // State
        profile,
        loading,
        error,
        validationErrors,
        profileExists,
        onboardingCompleted,
        needsProfileCreation,

        // Actions
        fetchProfile,
        refreshProfile,
        updateProfile,
        updatePreferences,
        completeOnboarding,
        clearError,
        validateProfile,
        setProfileCreated,
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

export default ProfileProvider;
