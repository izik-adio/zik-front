import { storage } from './storage';

/**
 * Reset app state for testing - clears onboarding and auth data
 * This is useful for testing the full app flow
 */
export const resetAppForTesting = async () => {
  try {
    await storage.removeItem('hasOnboarded');
    await storage.removeItem('selectedGoals');
    await storage.removeItem('onboardingSkipped');
    await storage.removeItem('authTokens');
    await storage.removeItem('userData');
    console.log('App state reset successfully');
  } catch (error) {
    console.error('Error resetting app state:', error);
  }
};

/**
 * Reset only onboarding state
 */
export const resetOnboarding = async () => {
  try {
    await storage.removeItem('hasOnboarded');
    await storage.removeItem('selectedGoals');
    await storage.removeItem('onboardingSkipped');
    console.log('Onboarding state reset successfully');
  } catch (error) {
    console.error('Error resetting onboarding state:', error);
  }
};
