import { useState, useCallback } from 'react';
import { profileApi, ProfileApiError } from '../src/api/profile';
import {
    UserProfile,
    CreateProfileRequest,
    UpdateProfileRequest,
    UserPreferences,
} from '../src/types/api';

interface UseProfileState {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    validationErrors: Record<string, string>;
}

interface UseProfileActions {
    fetchProfile: () => Promise<UserProfile | null>;
    createProfile: (data: CreateProfileRequest) => Promise<UserProfile | null>;
    updateProfile: (data: UpdateProfileRequest) => Promise<UserProfile | null>;
    updatePreferences: (preferences: Partial<UserPreferences>) => Promise<UserProfile | null>;
    completeOnboarding: () => Promise<boolean>;
    clearError: () => void;
    validateProfile: (data: CreateProfileRequest | UpdateProfileRequest) => boolean;
}

interface UseProfileReturn extends UseProfileState, UseProfileActions { }

/**
 * Custom hook for profile management
 * Provides comprehensive profile operations with loading states and error handling
 */
export const useProfile = (): UseProfileReturn => {
    const [state, setState] = useState<UseProfileState>({
        profile: null,
        loading: false,
        error: null,
        validationErrors: {},
    });

    const setLoading = useCallback((loading: boolean) => {
        setState(prev => ({ ...prev, loading }));
    }, []);

    const setError = useCallback((error: string | null) => {
        setState(prev => ({ ...prev, error, loading: false }));
    }, []);

    const setProfile = useCallback((profile: UserProfile | null) => {
        setState(prev => ({ ...prev, profile, error: null, loading: false }));
    }, []);

    const setValidationErrors = useCallback((validationErrors: Record<string, string>) => {
        setState(prev => ({ ...prev, validationErrors }));
    }, []);

    /**
     * Fetch the current user's profile
     */
    const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
        setLoading(true);
        setError(null);

        try {
            const profile = await profileApi.getProfileWithRetry();
            setProfile(profile);
            return profile;
        } catch (error) {
            const errorMessage = error instanceof ProfileApiError
                ? error.message
                : 'Failed to fetch profile';
            setError(errorMessage);
            return null;
        }
    }, [setLoading, setError, setProfile]);

    /**
     * Create a new user profile
     */
    const createProfile = useCallback(async (data: CreateProfileRequest): Promise<UserProfile | null> => {
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
            const profile = await profileApi.createProfile(data);
            setProfile(profile);
            return profile;
        } catch (error) {
            const errorMessage = error instanceof ProfileApiError
                ? error.message
                : 'Failed to create profile';
            setError(errorMessage);
            return null;
        }
    }, [setLoading, setError, setProfile, setValidationErrors]);

    /**
     * Update the current user's profile
     */
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
            const profile = await profileApi.updateProfile(data);
            setProfile(profile);
            return profile;
        } catch (error) {
            const errorMessage = error instanceof ProfileApiError
                ? error.message
                : 'Failed to update profile';
            setError(errorMessage);
            return null;
        }
    }, [setLoading, setError, setProfile, setValidationErrors]);

    /**
     * Update user preferences only
     */
    const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>): Promise<UserProfile | null> => {
        setLoading(true);
        setError(null);

        try {
            const profile = await profileApi.updatePreferences(preferences);
            setProfile(profile);
            return profile;
        } catch (error) {
            const errorMessage = error instanceof ProfileApiError
                ? error.message
                : 'Failed to update preferences';
            setError(errorMessage);
            return null;
        }
    }, [setLoading, setError, setProfile]);

    /**
     * Complete the user's onboarding process
     */
    const completeOnboarding = useCallback(async (): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            await profileApi.completeOnboarding();

            // Update the profile state to reflect onboarding completion
            if (state.profile) {
                setProfile({
                    ...state.profile,
                    onboardingCompleted: true,
                });
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof ProfileApiError
                ? error.message
                : 'Failed to complete onboarding';
            setError(errorMessage);
            return false;
        }
    }, [setLoading, setError, setProfile, state.profile]);

    /**
     * Clear the current error state
     */
    const clearError = useCallback(() => {
        setError(null);
        setValidationErrors({});
    }, [setError, setValidationErrors]);

    /**
     * Validate profile data without making API call
     */
    const validateProfile = useCallback((data: CreateProfileRequest | UpdateProfileRequest): boolean => {
        const validation = profileApi.validateProfile(data);
        setValidationErrors(validation.errors);
        return validation.isValid;
    }, [setValidationErrors]);

    return {
        // State
        profile: state.profile,
        loading: state.loading,
        error: state.error,
        validationErrors: state.validationErrors,

        // Actions
        fetchProfile,
        createProfile,
        updateProfile,
        updatePreferences,
        completeOnboarding,
        clearError,
        validateProfile,
    };
};

export default useProfile;
