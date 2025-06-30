import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cognitoService, AuthTokens, UserAttributes } from '../services/cognito';
import { storage } from '../utils/storage';
import { setGlobalLogout } from '../utils/authUtils';
import { router } from 'expo-router';

interface AuthContextType {
  user: UserAttributes | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<{ requiresConfirmation: boolean }>;
  confirmSignup: (email: string, confirmationCode: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, confirmationCode: string, newPassword: string) => Promise<void>;
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
  
  // Register the logout function with the global auth utils on mount
  useEffect(() => {
    console.log('Registering global logout function');
    setGlobalLogout(() => logout);
    
    return () => {
      // Clear the global logout function when component unmounts
      setGlobalLogout(() => async () => {
        console.warn('Default logout called after AuthContext unmounted');
        await storage.clear();
      });
    };
  }, []);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('Checking auth state...');
      const tokens = await storage.getItem<AuthTokens>('authTokens');
      const userData = await storage.getItem<UserAttributes>('userData');

      if (tokens && userData) {
        console.log('Found auth tokens and user data');
        setUser(userData);
      } else {
        console.log('No auth tokens or user data found');
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const { tokens, user: userData } = await cognitoService.signIn(email, password);

      await storage.setItem('authTokens', tokens);
      await storage.setItem('userData', userData);

      setUser(userData);
      console.log('Login successful for:', email);
    } catch (error) {
      console.error('Login failed:', error);
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
      await cognitoService.confirmSignUp(email, confirmationCode);
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

  const confirmForgotPassword = async (email: string, confirmationCode: string, newPassword: string) => {
    try {
      await cognitoService.confirmForgotPassword(email, confirmationCode, newPassword);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user');
      await storage.clear();
      await cognitoService.logout();
      setUser(null);
      
      // Force navigation to login screen
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
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
