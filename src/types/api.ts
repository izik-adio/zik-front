// Core data structures based on Zik API documentation - Unified Model

export interface EpicQuest {
  questId: string; // Unique identifier (e.g., 'epic_abc123')
  userId: string; // User's unique identifier
  title: string; // Quest name/title
  status: 'active' | 'completed' | 'paused'; // Current status
  description?: string; // Optional detailed description
  category?: string; // Optional category (e.g., 'health', 'career')
  targetDate: string; // Target completion date (YYYY-MM-DD)
  roadmapStatus: 'none' | 'generating' | 'ready' | 'error'; // Roadmap generation status
  createdAt: string; // ISO-8601 timestamp of creation
  updatedAt: string; // ISO-8601 timestamp of last update
}

export interface DailyQuest {
  questId: string; // Unique identifier (e.g., 'daily_xyz789')
  userId: string; // User's unique identifier
  title: string; // Quest name/title
  description: string; // Quest description
  dueDate: string; // Due date in YYYY-MM-DD format
  priority: 'low' | 'medium' | 'high'; // Priority level
  status: 'pending' | 'in-progress' | 'completed'; // Current status
  epicQuestId?: string; // Optional link to an epic quest
  milestoneId?: string; // Optional link to a milestone
  createdAt: string; // ISO-8601 timestamp of creation
  updatedAt: string; // ISO-8601 timestamp of last update
}

export interface Milestone {
  milestoneId: string;
  epicQuestId: string; // Link to epic quest
  sequence: number; // Order of the milestone (1, 2, 3...)
  title: string;
  description: string;
  status: 'locked' | 'active' | 'completed';
  durationInDays: number;
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

export interface ChatResponse {
  response: string; // AI-generated response text
  timestamp: string; // ISO 8601 timestamp of response
  requestId: string; // Unique request identifier for debugging
}

// API Request/Response types

export interface GetQuestsResponse {
  epicQuests: EpicQuest[];
  dailyQuests: DailyQuest[];
}

export interface CreateQuestRequest {
  title: string;
  description?: string;
  type: 'epic' | 'daily';
  targetDate?: string; // For epic quests
  dueDate?: string; // For daily quests
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  epicQuestId?: string; // For daily quests linked to epic quests
  milestoneId?: string; // For daily quests linked to milestones
}

export interface UpdateQuestRequest {
  title?: string;
  description?: string;
  status?: 'active' | 'completed' | 'paused' | 'pending' | 'in-progress';
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

export interface ChatRequest {
  message: string;
  context?: string;
}

export interface DeleteQuestResponse {
  success: boolean;
  message?: string;
}

// Profile types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    dailyReminders: boolean;
    weeklyDigest: boolean;
  };
  timezone: string;
  language: string;
  questCategories: string[];
  privacySettings: {
    shareProgress: boolean;
    publicProfile: boolean;
  };
}

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  onboardingCompleted: boolean;
  createdAt: string;
  lastLoginAt?: string;
  updatedAt: string;
}

export interface CreateProfileRequest {
  username: string;
  displayName: string;
  preferences?: Partial<UserPreferences>;
}

export interface UpdateProfileRequest {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

export interface ProfileResponse {
  profile: UserProfile;
  timestamp: string;
  requestId: string;
}

export interface ProfileCreateResponse {
  message: string;
  profile: UserProfile;
  timestamp: string;
  requestId: string;
}

export interface ProfileUpdateResponse {
  message: string;
  profile: UserProfile;
  timestamp: string;
  requestId: string;
}

export interface OnboardingCompleteResponse {
  message: string;
  timestamp: string;
  requestId: string;
}

// Error response type
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}
