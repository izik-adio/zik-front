// src/utils/authUtils.ts
// Centralized authentication utilities for consistent auth handling

import { storage } from './storage';
import { router } from 'expo-router';

// Global logout function that will be set by the AuthContext
let globalLogout: (() => Promise<void>) | null = null;

/**
 * Set the global logout function from AuthContext
 * This allows API interceptors to trigger a proper logout
 */
export const setGlobalLogout = (logoutFn: () => Promise<void>) => {
  console.log('Setting global logout function');
  globalLogout = logoutFn;
};

/**
 * Trigger a global logout that properly updates auth state
 * This should be called by API interceptors on auth failures
 */
export const triggerGlobalLogout = async (): Promise<void> => {
  console.log('Triggering global logout');
  
  if (globalLogout) {
    try {
      await globalLogout();
      console.log('Global logout completed successfully');
    } catch (error) {
      console.error('Error during global logout:', error);
      // Fallback to manual logout
      await manualLogout();
    }
  } else {
    console.warn('Global logout function not set. Falling back to manual logout.');
    await manualLogout();
  }
};

/**
 * Manual logout as fallback when global logout is not available
 * This clears storage and redirects to login
 */
const manualLogout = async (): Promise<void> => {
  try {
    console.log('Performing manual logout');
    // Clear all storage
    await storage.clear();
    
    // Force navigation to login screen
    if (router) {
      console.log('Redirecting to login screen');
      router.replace('/auth/login');
    }
  } catch (error) {
    console.error('Error during manual logout:', error);
  }
};