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
      const profileData = await profileApi.getProfile();
      setProfile(profileData);
      setNeedsProfileCreation(false);
      // Cache the profile after successful fetch
      await storage.setItem('cachedProfile', profileData);
    } catch (err) {
      if (err instanceof ProfileApiError && err.status === 404) {
        setProfile(null);
        setNeedsProfileCreation(true);
        await tryAutoCreateProfile();
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
      // Check if we have stored signup data
      const storedData = await storage.getItem<{
        firstName: string;
        lastName: string;
        username: string;
      }>('signupProfileData');

      if (storedData) {
        await createProfile({
          username: storedData.username,
          firstName: storedData.firstName,
          lastName: storedData.lastName,
        });
        return;
      }

      // Check if we have stored name from onboarding
      const preferredName = await storage.getItem<string>('preferredName');
      if (preferredName) {
        const nameParts = preferredName.trim().split(' ');
        await createProfile({
          username: 'user', // fallback
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || '',
        });
        return;
      }

      // Last resort - create with minimal data
      await createProfile({
        username: 'user',
        firstName: 'User',
        lastName: 'Account',
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
      const newProfile = await profileApi.createProfile(data);
      setProfile(newProfile);
      setNeedsProfileCreation(false);
    } catch (err) {
      if (err instanceof ProfileApiError) {
        if (err.status === 400) {
          // Validation error
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
          // Validation error
          setValidationErrors({ general: err.message });
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
