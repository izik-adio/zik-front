import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  cognitoService,
  AuthTokens,
  UserAttributes,
} from '../services/cognito';
import { storage } from '../utils/storage';
import { router } from 'expo-router';
import { setGlobalLogoutCallback } from '../utils/authRedirect';
import { profileApi } from '../api/profile';

interface AuthContextType {
  user: UserAttributes | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ requiresConfirmation: boolean }>;
  confirmSignup: (email: string, confirmationCode: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (
    email: string,
    confirmationCode: string,
    newPassword: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserAttributes | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const tokens = await storage.getItem<AuthTokens>('authTokens');
      const userData = await storage.getItem<UserAttributes>('userData');

      if (tokens && userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await storage.clear();
      await cognitoService.logout();
      setUser(null);

      // Force navigation to login screen
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Register global logout callback
  useEffect(() => {
    setGlobalLogoutCallback(logout);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { tokens, user: userData } = await cognitoService.signIn(
        email,
        password
      );

      await storage.setItem('authTokens', tokens);
      await storage.setItem('userData', userData);

      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      return await cognitoService.signUp(email, password, name);
    } catch (error) {
      throw error;
    }
  };

  const confirmSignup = async (email: string, confirmationCode: string) => {
    try {
      // Try to retrieve the password for auto-login
      let signupPassword = await storage.getItem<string>('signupPassword');
      if (!signupPassword) {
        throw new Error(
          'Password not found for auto-login. Please log in manually.'
        );
      }
      // First confirm the signup with Cognito and sign in
      const { tokens, user: userData } = await cognitoService.confirmSignUp(
        email,
        confirmationCode,
        signupPassword
      );
      await storage.setItem('authTokens', tokens);
      await storage.setItem('userData', userData);
      setUser(userData);
      // Clean up stored password
      await storage.removeItem('signupPassword');

      // Auto-create profile after successful confirmation
      try {
        console.log(
          'Attempting to create profile after signup confirmation...'
        );
        const profileData = await storage.getItem<{
          firstName: string;
          lastName: string;
          displayName: string;
        }>('signupProfileData');

        if (profileData) {
          console.log('Found profile data in storage:', profileData);
          // Create profile using the stored signup data
          const createdProfile = await profileApi.createProfile({
            username: userData.email
              .split('@')[0]
              .replace(/[^a-zA-Z0-9]/g, '')
              .toLowerCase(),
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            displayName: profileData.displayName,
          });

          console.log('Profile created successfully:', createdProfile);
          // Clean up stored signup data
          await storage.removeItem('signupProfileData');
        } else {
          console.log('No signup profile data found in storage');
        }
      } catch (profileError) {
        console.error('Failed to create profile after signup:', profileError);
        // Show user-friendly error for profile creation failure
        console.log(
          'Profile creation failed, but user signup was successful. User can create profile manually.'
        );
        // Don't throw here - user is signed up successfully, profile can be created later
      }

      // Clear any stored onboarding data
      await storage.removeItem('preferredName');
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await cognitoService.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const confirmForgotPassword = async (
    email: string,
    confirmationCode: string,
    newPassword: string
  ) => {
    try {
      await cognitoService.confirmForgotPassword(
        email,
        confirmationCode,
        newPassword
      );
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    confirmSignup,
    forgotPassword,
    confirmForgotPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
