import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, UserPreferences } from '../types/api';
import { profileApi, ProfileApiError } from '../api/profile';
import { useAuth } from './AuthContext';

interface ProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    profileExists: boolean;
    onboardingCompleted: boolean;

    // Actions
    fetchProfile: () => Promise<UserProfile | null>;
    refreshProfile: () => Promise<void>;
    updatePreferences: (preferences: Partial<UserPreferences>) => Promise<boolean>;
    completeOnboarding: () => Promise<boolean>;
    clearError: () => void;

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
    const [profileExists, setProfileExists] = useState(false);
    const [needsProfileCreation, setNeedsProfileCreation] = useState(false);

    const { isAuthenticated, user } = useAuth();

    // Computed values
    const onboardingCompleted = profile?.onboardingCompleted ?? false;

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchProfile();
        } else {
            // Clear profile state when user logs out
            setProfile(null);
            setProfileExists(false);
            setNeedsProfileCreation(false);
            setError(null);
        }
    }, [isAuthenticated, user]);

    const fetchProfile = async (): Promise<UserProfile | null> => {
        if (!isAuthenticated) {
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const profileData = await profileApi.getProfileWithRetry();

            if (profileData) {
                setProfile(profileData);
                setProfileExists(true);
                setNeedsProfileCreation(false);
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
                    setProfile(null);
                    setProfileExists(false);
                    setNeedsProfileCreation(true);
                } else if (error.status === 401) {
                    // Auth error - will be handled by AuthContext
                    setError('Authentication required');
                } else {
                    setError(error.message);
                }
            } else {
                setError('Failed to load profile');
            }

            return null;
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async (): Promise<void> => {
        await fetchProfile();
    };

    const updatePreferences = async (preferences: Partial<UserPreferences>): Promise<boolean> => {
        if (!profile) {
            setError('No profile loaded');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            const updatedProfile = await profileApi.updatePreferences(preferences);
            setProfile(updatedProfile);
            return true;
        } catch (error) {
            console.error('Error updating preferences:', error);
            const errorMessage = error instanceof ProfileApiError
                ? error.message
                : 'Failed to update preferences';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

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

    const clearError = (): void => {
        setError(null);
    };

    const setProfileCreated = (newProfile: UserProfile): void => {
        setProfile(newProfile);
        setProfileExists(true);
        setNeedsProfileCreation(false);
        setError(null);
    };

    const value: ProfileContextType = {
        // State
        profile,
        loading,
        error,
        profileExists,
        onboardingCompleted,
        needsProfileCreation,

        // Actions
        fetchProfile,
        refreshProfile,
        updatePreferences,
        completeOnboarding,
        clearError,
        setProfileCreated,
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

export default ProfileProvider;
