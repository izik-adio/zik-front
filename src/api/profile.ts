import api from './axios';
import {
  UserProfile,
  CreateProfileRequest,
  UpdateProfileRequest,
  ProfileResponse,
  ProfileCreateResponse,
  ProfileUpdateResponse,
  OnboardingCompleteResponse,
  UserPreferences,
} from '../types/api';

// Re-export types for backwards compatibility
export interface Profile extends UserProfile { }
export interface UpdateProfileData extends UpdateProfileRequest { }

/**
 * Profile API Service
 * Handles all profile-related API operations including CRUD operations,
 * preferences management, and onboarding completion.
 */
export class ProfileApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'ProfileApiError';
  }
}

/**
 * Default user preferences for new profiles
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  notifications: {
    email: true,
    push: true,
    dailyReminders: true,
    weeklyDigest: true,
  },
  timezone: 'UTC',
  language: 'en',
  questCategories: [],
  privacySettings: {
    shareProgress: false,
    publicProfile: false,
  },
};

/**
 * Helper function to handle API errors consistently
 */
const handleApiError = (error: any): never => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    // Extract error message from the nested structure
    const errorData = error.response.data;
    const message = errorData?.error || 
                   (errorData?.data && errorData.data.message) || 
                   errorData?.message ||
                   'Request failed';
    const details = errorData;

    throw new ProfileApiError(status, message, details);
  } else if (error.request) {
    // Request was made but no response received
    throw new ProfileApiError(0, 'Unable to connect to the server. Please check your internet connection.');
  } else {
    // Something else happened
    throw new ProfileApiError(0, error.message || 'An unexpected error occurred');
  }
};

/**
 * Profile API methods
 */
export const profileApi = {
  /**
   * Fetch the current user's profile
   * @returns Promise<UserProfile> The user's profile data
   * @throws ProfileApiError If profile doesn't exist (404) or other API errors
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get('/profile');

      // Check if response has the expected structure
      if (!response || !response.data) {
        throw new ProfileApiError(0, 'Invalid response format: no data received');
      }

      // Handle the nested structure from backend
      const responseData = response.data;
      
      // Check if the response has the expected structure
      if (responseData.data && responseData.data.profile) {
        return responseData.data.profile;
      } else if (responseData.profile) {
        // Fallback for simpler response structure
        return responseData.profile;
      }

      throw new ProfileApiError(404, 'Profile not found in response');
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Create a new user profile
   * @param profileData The profile data for creation
   * @returns Promise<UserProfile> The created profile
   * @throws ProfileApiError If validation fails or username is taken
   */
  async createProfile(profileData: CreateProfileRequest): Promise<UserProfile> {
    try {
      // Merge with default preferences if provided
      const requestData = {
        ...profileData,
        preferences: profileData.preferences
          ? { ...DEFAULT_PREFERENCES, ...profileData.preferences }
          : DEFAULT_PREFERENCES,
      };

      const response = await api.post('/profile', requestData);

      // Check if response has the expected structure
      if (!response || !response.data) {
        throw new ProfileApiError(0, 'Invalid response format: no data received');
      }

      // Handle the nested structure from backend
      const responseData = response.data;
      
      // Check if the response has the expected structure
      if (responseData.data && responseData.data.profile) {
        return responseData.data.profile;
      } else if (responseData.profile) {
        // Fallback for simpler response structure
        return responseData.profile;
      }

      throw new ProfileApiError(400, 'Profile not found in create response');
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Update the current user's profile
   * @param updatedData Partial profile data to update
   * @returns Promise<UserProfile> The updated profile
   * @throws ProfileApiError If validation fails or unauthorized
   */
  async updateProfile(updatedData: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await api.put('/profile', updatedData);

      // Check if response has the expected structure
      if (!response || !response.data) {
        throw new ProfileApiError(0, 'Invalid response format: no data received');
      }

      // Handle the nested structure from backend
      const responseData = response.data;
      
      // Check if the response has the expected structure
      if (responseData.data && responseData.data.profile) {
        return responseData.data.profile;
      } else if (responseData.profile) {
        // Fallback for simpler response structure
        return responseData.profile;
      }

      throw new ProfileApiError(400, 'Profile not found in update response');
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Update user preferences only
   * @param preferences Partial preferences to update
   * @returns Promise<UserProfile> The updated profile
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserProfile> {
    return this.updateProfile({ preferences });
  },

  /**
   * Complete the user's onboarding process
   * @returns Promise<void>
   * @throws ProfileApiError If onboarding completion fails
   */
  async completeOnboarding(): Promise<void> {
    try {
      await api.put('/profile/onboarding/complete');
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Validate profile data before submission
   * @param data Profile data to validate
   * @returns Object with validation results
   */
  validateProfile(data: CreateProfileRequest | UpdateProfileRequest): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    // Username validation (if provided)
    if (data.username !== undefined) {
      if (!data.username || data.username.length < 3 || data.username.length > 30) {
        errors.username = 'Username must be between 3 and 30 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        errors.username = 'Username can only contain letters, numbers, and underscores';
      }
    }

    // For CreateProfileRequest, firstName and lastName are required
    if ('firstName' in data && 'lastName' in data) {
      if (!data.firstName || data.firstName.trim().length === 0) {
        errors.firstName = 'First name is required';
      } else if (data.firstName.length > 50) {
        errors.firstName = 'First name must be less than 50 characters';
      }

      if (!data.lastName || data.lastName.trim().length === 0) {
        errors.lastName = 'Last name is required';
      } else if (data.lastName.length > 50) {
        errors.lastName = 'Last name must be less than 50 characters';
      }
    }

    // For UpdateProfileRequest, firstName and lastName are optional but must be valid if provided
    if ('firstName' in data && data.firstName !== undefined) {
      if (data.firstName.length > 50) {
        errors.firstName = 'First name must be less than 50 characters';
      }
    }

    if ('lastName' in data && data.lastName !== undefined) {
      if (data.lastName.length > 50) {
        errors.lastName = 'Last name must be less than 50 characters';
      }
    }

    // Display Name validation (optional for updates, but if provided should be valid)
    if ('displayName' in data && data.displayName !== undefined) {
      if (data.displayName && data.displayName.length > 100) {
        errors.displayName = 'Display name must be less than 100 characters';
      }
    }

    // Avatar URL validation (basic) - only for update requests
    if ('avatarUrl' in data && data.avatarUrl && !data.avatarUrl.startsWith('http')) {
      errors.avatarUrl = 'Avatar URL must be a valid HTTP/HTTPS URL';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Get profile with retry and error recovery
   * @param maxRetries Maximum number of retry attempts
   * @returns Promise<UserProfile | null> Profile or null if not found
   */
  async getProfileWithRetry(maxRetries: number = 2): Promise<UserProfile | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Attempting to get profile (attempt ${attempt + 1}/${maxRetries})`);
        return await this.getProfile();
      } catch (error) {
        lastError = error as Error;
        console.error(`Profile fetch attempt ${attempt + 1} failed:`, error);

        // Don't retry on 404 (profile doesn't exist) or 401 (unauthorized)
        if (error instanceof ProfileApiError && (error.status === 404 || error.status === 401)) {
          if (error.status === 404) {
            console.log('Profile not found (404), returning null');
            return null; // Profile doesn't exist
          }
          console.log('Authentication error (401), re-throwing');
          throw error; // Re-throw auth errors
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('All profile fetch attempts failed, throwing last error');
    throw lastError;
  },
};

/**
 * Auto-create profile with smart defaults from user's name and email
 * This is used after signup to create a basic profile without user friction
 */
export const createAutoProfile = async (fullName: string, email: string): Promise<UserProfile> => {
  // Parse the full name into first and last name
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || email.split('@')[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

  // Use the full name as display name if provided
  const displayName = fullName.trim() || `${firstName} ${lastName}`;

  // Generate a default username from email or name
  const emailPart = email.split('@')[0];
  const baseUsername = emailPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Create profile with defaults matching backend requirements
  const profileData: CreateProfileRequest = {
    username: baseUsername,
    firstName,
    lastName,
    displayName,
    preferences: {
      ...DEFAULT_PREFERENCES,
      // Smart defaults based on device/locale
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      language: 'en', // Could detect from device locale
    },
  };

  // Try to create profile with retries for common issues
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      return await profileApi.createProfile(profileData);
    } catch (error) {
      attempts++;
      
      // Handle username conflicts
      if (error instanceof ProfileApiError && 
          (error.message.includes('username') || 
           error.message.toLowerCase().includes('already exists'))) {
        const timestamp = Date.now().toString().slice(-4);
        profileData.username = `${baseUsername}${timestamp}`;
        // Continue to retry with new username
        console.log(`Username conflict, trying with: ${profileData.username}`);
      } 
      // Handle validation errors
      else if (error instanceof ProfileApiError && error.status === 400) {
        // Try to fix validation issues
        if (error.message.includes('firstName')) {
          profileData.firstName = 'User';
        }
        if (error.message.includes('lastName')) {
          profileData.lastName = 'Account';
        }
        console.log('Fixing validation issues in profile data');
        // Continue to retry with fixed data
      }
      // If last attempt or other error, throw
      else if (attempts >= maxAttempts) {
        console.error('Failed to create profile after multiple attempts:', error);
        throw error;
      }
    }
  }
  
  throw new Error('Failed to create profile after multiple attempts');
};

// Backwards compatibility export
export default profileApi;