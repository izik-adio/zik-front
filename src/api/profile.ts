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
    weeklyDigest: false,
  },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  language: 'en',
  questCategories: ['health', 'career', 'personal', 'learning'],
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
    const message = error.response.data?.error || error.response.data?.message || 'Request failed';
    const details = error.response.data;

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
      const data: ProfileResponse = response.data;
      return data.profile;
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
      const data: ProfileCreateResponse = response.data;
      return data.profile;
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
      const data: ProfileUpdateResponse = response.data;
      return data.profile;
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
   * Check if a username is available
   * @param username The username to check
   * @returns Promise<boolean> True if available, false if taken
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      // This would need to be implemented as a separate endpoint
      // For now, we'll catch the error from create/update attempts
      const response = await api.get(`/profile/username/check?username=${encodeURIComponent(username)}`);
      return response.data.available;
    } catch (error: any) {
      // If endpoint doesn't exist, return true (optimistic)
      if (error.response?.status === 404) {
        return true;
      }
      return false;
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

    // Name validation (required for creation)
    if ('displayName' in data) {
      if (!data.displayName || data.displayName.length > 100) {
        errors.displayName = 'Display name is required and must be less than 100 characters';
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

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.getProfile();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on 404 (profile doesn't exist) or 401 (unauthorized)
        if (error instanceof ProfileApiError && (error.status === 404 || error.status === 401)) {
          if (error.status === 404) {
            return null; // Profile doesn't exist
          }
          throw error; // Re-throw auth errors
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  },
};

/**
 * Auto-create profile with smart defaults from user's name and email
 * This is used after signup to create a basic profile without user friction
 */
export const createAutoProfile = async (fullName: string, email: string): Promise<UserProfile> => {
  // Use the full name as display name
  const displayName = fullName.trim() || email.split('@')[0];

  // Generate a default username from email or name
  const emailPart = email.split('@')[0];
  const baseUsername = emailPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Create profile with defaults
  const profileData: CreateProfileRequest = {
    username: baseUsername,
    displayName,
    preferences: {
      ...DEFAULT_PREFERENCES,
      // Smart defaults based on device/locale
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      language: 'en', // Could detect from device locale
    },
  };

  try {
    return await profileApi.createProfile(profileData);
  } catch (error) {
    // If username is taken, try with a suffix
    if (error instanceof ProfileApiError && error.message.includes('username')) {
      const timestamp = Date.now().toString().slice(-4);
      profileData.username = `${baseUsername}${timestamp}`;
      return await profileApi.createProfile(profileData);
    }
    throw error;
  }
};

// Backwards compatibility export
export default profileApi;