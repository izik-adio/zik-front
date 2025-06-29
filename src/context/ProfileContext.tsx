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

    const fetchProfile = async (): Promise<UserProfile | null> => {
        if (!isAuthenticated) {
            return null;
        }

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
            return cachedProfile;
        }

        try {
            const profileData = await profileApi.getProfileWithRetry();

            if (profileData) {
                setProfile(profileData);
                setProfileExists(true);
                setNeedsProfileCreation(false);

                // Update cache
                await setCachedProfile(profileData);
            } else {
                // Profile doesn't exist, user needs to create one
                setProfile(null);
                setProfileExists(false);
                setNeedsProfileCreation(true);
            }

            return profileData;
        } catch (error) {
            console.error('Error fetching profile:', error);

            if (error instanceof ProfileApiError) {
                if (error.status === 404) {
                    // Profile doesn't exist
                    console.log('Profile not found, user needs to create one');
                    setProfile(null);
                    setProfileExists(false);
                    setNeedsProfileCreation(true);
                } else if (error.status === 401) {
                    // Auth error - will be handled by AuthContext
                    console.log('Authentication error while fetching profile');
                    setError('Authentication required');
                } else if (error.status === 0) {
                    // Network error - this is likely what you're experiencing
                    console.log('Network error while fetching profile, checking if profile creation needed');
                    setProfile(null);
                    setProfileExists(false);
                    setNeedsProfileCreation(true);
                    setError('Network connection issue - please check your internet connection');
                } else {
                    setError(`Profile API Error: ${error.message}`);
                }
            } else {
                // For any other error, assume profile creation might be needed
                console.log('Unknown error fetching profile, assuming profile creation needed');
                setProfile(null);
                setProfileExists(false);
                setNeedsProfileCreation(true);
                setError('Failed to load profile - will attempt to create one');
            }

            return null;
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async (): Promise<void> => {
        // Clear cache before fetching to ensure fresh data
        await clearProfileCache();
        await fetchProfile();
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
            console.error('Error updating profile:', error);
            let errorMessage = 'Failed to update profile';

            if (error instanceof ProfileApiError) {
                errorMessage = `Profile Update Error: ${error.message}`;
            } else if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = `Profile Update Error: ${(error as Error).message}`;
            }

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
            console.error('Error updating preferences:', error);
            const errorMessage = error instanceof ProfileApiError
                ? error.message
                : 'Failed to update preferences';
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
            console.error('Error completing onboarding:', error);
            const errorMessage = error instanceof ProfileApiError
                ? error.message
                : 'Failed to complete onboarding';
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
