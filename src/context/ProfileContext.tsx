import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { profileApi, ProfileApiError } from '../api/profile';
import { UserProfile } from '../types/api';
import { storage } from '../utils/storage';

// Define the context type
interface ProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  needsProfileCreation: boolean;
  onboardingCompleted: boolean;
  refreshProfile: () => Promise<void>;
  createProfile: (data: any) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  validationErrors: Record<string, string>;
  clearError: () => void;
}

// Create the context with default values
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Custom hook to use the profile context
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

// Provider component
export const ProfileProvider: React.FC<ProfileProviderProps> = ({
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsProfileCreation, setNeedsProfileCreation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // On mount, try to load cached profile first
  useEffect(() => {
    (async () => {
      const cachedProfile = await storage.getItem<UserProfile>('cachedProfile');
      if (cachedProfile) {
        setProfile(cachedProfile);
      }
    })();
  }, []);

  // Get computed onboarding status from profile
  const onboardingCompleted = profile?.onboardingCompleted ?? false;

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors({});
  }, []);

  // Refresh profile function
  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Attempting to fetch user profile...');
      const profileData = await profileApi.getProfile();
      console.log('Profile fetched successfully:', profileData);
      setProfile(profileData);
      setNeedsProfileCreation(false);
      // Cache the profile after successful fetch
      await storage.setItem('cachedProfile', profileData);
    } catch (err) {
      console.error('Error refreshing profile:', err);
      if (err instanceof ProfileApiError && err.status === 404) {
        console.log(
          'Profile not found (404), setting needsProfileCreation to true'
        );
        setProfile(null);
        setNeedsProfileCreation(true);
        await tryAutoCreateProfile();
      } else if (err instanceof ProfileApiError && err.status === 401) {
        console.log('Unauthorized (401) - auth tokens may be invalid');
        setError('Authentication required. Please log in again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        console.error('Error refreshing profile:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Try to auto-create profile for existing users
  const tryAutoCreateProfile = useCallback(async () => {
    try {
      console.log('Attempting to auto-create profile...');
      // Check if we have stored signup data
      const storedData = await storage.getItem<{
        firstName: string;
        lastName: string;
        username: string;
      }>('signupProfileData');

      if (storedData) {
        console.log('Found stored signup data:', storedData);
        await createProfile({
          username: storedData.username,
          firstName: storedData.firstName,
          lastName: storedData.lastName,
          displayName: storedData.username, // TEMP: use username as displayName
        });
        return;
      }

      // Check if we have stored name from onboarding
      const preferredName = await storage.getItem<string>('preferredName');
      if (preferredName) {
        console.log('Found preferred name:', preferredName);
        const nameParts = preferredName.trim().split(' ');
        await createProfile({
          username: 'user', // fallback
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || '',
          displayName: 'user', // TEMP: use username as displayName
        });
        return;
      }

      // Last resort - create with minimal data
      console.log('No stored data found, creating minimal profile');
      await createProfile({
        username: 'user',
        firstName: 'User',
        lastName: 'Account',
        displayName: 'user', // TEMP: use username as displayName
      });
    } catch (error) {
      console.error('Failed to auto-create profile:', error);
      // Don't set error here, let user manually create profile
    }
  }, []);

  // Create profile function
  const createProfile = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    setValidationErrors({});
    try {
      console.log('Creating profile with data:', data);
      const newProfile = await profileApi.createProfile(data);
      console.log('Profile created successfully:', newProfile);
      setProfile(newProfile);
      setNeedsProfileCreation(false);
      // Cache the profile after successful creation
      await storage.setItem('cachedProfile', newProfile);
    } catch (err) {
      console.error('Error creating profile:', err);
      if (err instanceof ProfileApiError) {
        if (err.status === 400) {
          // Validation error
          console.log('Profile creation validation error:', err.message);
          setValidationErrors({ general: err.message });
        } else {
          setError(err.message);
        }
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to create profile'
        );
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (data: any): Promise<void> => {
    setLoading(true);
    setError(null);
    setValidationErrors({});
    try {
      const updatedProfile = await profileApi.updateProfile(data);
      setProfile(updatedProfile);
      // No return value needed for void
    } catch (err) {
      if (err instanceof ProfileApiError) {
        if (err.status === 400) {
          // Parse validation errors from the response
          const errorMessage = err.message;
          const errors: Record<string, string> = {};

          // Parse specific field errors from the error message
          if (errorMessage.toLowerCase().includes('username')) {
            if (
              errorMessage.toLowerCase().includes('3-30') ||
              errorMessage.toLowerCase().includes('characters')
            ) {
              errors.username = 'Username must be 3-30 characters long';
            } else if (
              errorMessage
                .toLowerCase()
                .includes('letters, numbers, and underscores') ||
              errorMessage.toLowerCase().includes('contain only')
            ) {
              errors.username =
                'Username must contain only letters, numbers, and underscores';
            } else if (
              errorMessage.toLowerCase().includes('already exists') ||
              errorMessage.toLowerCase().includes('taken')
            ) {
              errors.username = 'This username is already taken';
            } else {
              errors.username = errorMessage;
            }
          } else if (
            errorMessage.toLowerCase().includes('firstname') ||
            errorMessage.toLowerCase().includes('first name')
          ) {
            errors.firstName =
              'First name is required and must be less than 50 characters';
          } else if (
            errorMessage.toLowerCase().includes('lastname') ||
            errorMessage.toLowerCase().includes('last name')
          ) {
            errors.lastName =
              'Last name is required and must be less than 50 characters';
          } else if (
            errorMessage.toLowerCase().includes('displayname') ||
            errorMessage.toLowerCase().includes('display name')
          ) {
            errors.displayName =
              'Display name must be less than 100 characters';
          } else {
            errors.general = errorMessage;
          }

          setValidationErrors(errors);
        } else {
          setError(err.message);
        }
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to update profile'
        );
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Context value
  const value: ProfileContextType = {
    profile,
    loading,
    error,
    needsProfileCreation,
    onboardingCompleted,
    refreshProfile,
    createProfile,
    updateProfile,
    validationErrors,
    clearError,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export default ProfileProvider;
