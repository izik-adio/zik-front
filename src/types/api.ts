// Core data structures based on Zik API documentation

export interface EpicQuest {
  questId: string; // Unique identifier (e.g., 'epic_abc123')
  userId: string; // User's unique identifier
  title: string; // Quest name/title
  status: 'active' | 'completed' | 'paused'; // Current status
  description?: string; // Optional detailed description
  category?: string; // Optional category (e.g., 'health', 'career')
  targetDate?: string; // Optional target completion date (YYYY-MM-DD)
  createdAt: string; // ISO 8601 timestamp of creation
  updatedAt: string; // ISO 8601 timestamp of last update
}

export interface DailyQuest {
  questId: string; // Unique identifier (e.g., 'daily_xyz789')
  userId: string; // User's unique identifier
  epicId?: string; // ID of the linked Epic Quest (optional)
  title: string; // Task name/title
  status: 'pending' | 'in-progress' | 'completed' | 'skipped'; // Current status
  dueDate: string; // Due date in YYYY-MM-DD format
  priority: 'low' | 'medium' | 'high'; // Task priority level
  description?: string; // Optional detailed description
  createdAt: string; // ISO 8601 timestamp of creation
  updatedAt: string; // ISO 8601 timestamp of last update
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

export interface GetGoalsResponse {
  goals: {
    goalId: string;
    userId: string;
    goalName: string;
    status: 'active' | 'completed' | 'paused';
    description: string;
    category: string;
    targetDate: string;
    createdAt: string;
    updatedAt: string;
  }[];
  count: number;
  timestamp: string;
}

export interface CreateQuestRequest {
  title: string;
  type: 'goal' | 'task';
  dueDate?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  epicId?: string;
}

export interface UpdateQuestRequest {
  status?:
    | 'active'
    | 'completed'
    | 'paused'
    | 'pending'
    | 'in-progress'
    | 'skipped';
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  targetDate?: string;
  dueDate?: string;
}

export interface ChatRequest {
  message: string;
}

export interface DeleteQuestResponse {
  message: string;
  questId: string;
  timestamp: string;
}

// Error response type
export interface ApiError {
  error: string;
  timestamp: string;
  requestId?: string;
}
