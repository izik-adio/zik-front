// src/utils/authUtils.ts
// Centralized authentication utilities for consistent auth handling

// Global logout function that will be set by the AuthContext
let globalLogout: (() => Promise<void>) | null = null;

/**
 * Set the global logout function from AuthContext
 * This allows API interceptors to trigger a proper logout
 */
export const setGlobalLogout = (logoutFn: () => Promise<void>) => {
  globalLogout = logoutFn;
};

/**
 * Trigger a global logout that properly updates auth state
 * This should be called by API interceptors on auth failures
 */
export const triggerGlobalLogout = async (): Promise<void> => {
  if (globalLogout) {
    await globalLogout();
  } else {
    console.warn('Global logout function not set. Auth state may not be properly updated.');
    // Fallback to storage clear if no global logout is available
    const { storage } = await import('./storage');
    await storage.clear();
  }
};