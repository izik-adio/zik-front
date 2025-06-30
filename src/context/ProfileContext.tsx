import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define a simple profile interface
interface Profile {
  displayName: string | null;
  username: string | null;
  email: string | null;
}

// Define the context type
interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  needsProfileCreation: boolean;
  onboardingCompleted: boolean;
  refreshProfile: () => Promise<void>;
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
export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>({
    displayName: 'User',
    username: 'user',
    email: 'user@example.com'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsProfileCreation] = useState(false);
  const [onboardingCompleted] = useState(true);

  // Refresh profile function (simplified for now)
  const refreshProfile = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch profile data from an API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set mock profile data
      setProfile({
        displayName: 'User',
        username: 'user',
        email: 'user@example.com'
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error refreshing profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value: ProfileContextType = {
    profile,
    loading,
    error,
    needsProfileCreation,
    onboardingCompleted,
    refreshProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileProvider;