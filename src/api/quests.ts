import api from './axios';
import { storage } from '../utils/storage';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Task interface aligned with AWS backend data model
 */
export interface Task {
  taskId: string;
  userId: string;
  taskName: string;
  description: string;
  dueDate: string; // YYYY-MM-DD format
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  goalId?: string; // Optional link to a goal
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

/**
 * Goal interface aligned with AWS backend data model
 */
export interface Goal {
  goalId: string;
  userId: string;
  goalName: string;
  description: string;
  targetDate: string; // YYYY-MM-DD format
  category: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

/**
 * Union type for quest operations
 */
export type Quest = Task | Goal;

/**
 * Create Task request payload
 */
export interface CreateTaskData {
  title: string;
  dueDate: string; // YYYY-MM-DD format
  type: 'task';
  description: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  goalId?: string; // Optional link to a goal
}

/**
 * Create Goal request payload
 */
export interface CreateGoalData {
  title: string;
  dueDate: string; // YYYY-MM-DD format (targetDate)
  type: 'goal';
  description: string;
  priority?: 'low' | 'medium' | 'high';
  category: string;
}

/**
 * Union type for creation payloads
 */
export type CreateQuestData = CreateTaskData | CreateGoalData;

/**
 * Update Task request payload
 */
export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in-progress' | 'completed';
  goalId?: string;
}

/**
 * Update Goal request payload
 */
export interface UpdateGoalData {
  title?: string;
  description?: string;
  category?: string;
  status?: 'active' | 'completed' | 'paused';
}

/**
 * Union type for update payloads
 */
export type UpdateQuestData = UpdateTaskData | UpdateGoalData;

/**
 * Helper function to handle authentication errors
 */
const handleUnauthorized = async (): Promise<void> => {
  try {
    await storage.clear();
    // Navigation should be handled by AuthContext
    console.warn('User session expired, clearing storage');
  } catch (error) {
    console.error('Error clearing storage after unauthorized:', error);
  }
};

/**
 * Helper function to retry requests with exponential backoff
 */
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 1,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      // Don't retry 4xx errors (except 401 which is handled by interceptor)
      if (
        error.response?.status >= 400 &&
        error.response?.status < 500 &&
        error.response?.status !== 401
      ) {
        break;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Only retry 5xx errors
      if (error.response?.status >= 500) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  throw lastError || new Error('Unknown error occurred');
};

/**
 * Main API client for Quest operations
 */
export const questsApi = {
  /**
   * Fetch tasks for a specific date
   * @param date - Date in YYYY-MM-DD format
   * @returns Promise<Task[]>
   */
  async fetchTasksByDate(date: string): Promise<Task[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
    }

    return retryRequest(async () => {
      try {
        const response = await api.get(`/quests?date=${date}`);
        return response.data as Task[];
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch tasks';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Create a new task or goal
   * @param questData - Task or Goal creation data
   * @returns Promise<Task | Goal>
   */
  async createQuest(questData: CreateQuestData): Promise<Quest> {
    // Validate required fields
    if (!questData.title?.trim()) {
      throw new ApiError(400, 'Title is required');
    }
    if (!questData.dueDate) {
      throw new ApiError(400, 'Due date is required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(questData.dueDate)) {
      throw new ApiError(400, 'Due date must be in YYYY-MM-DD format');
    }

    return retryRequest(async () => {
      try {
        // Transform the data to match backend expectations
        const payload = {
          title: questData.title.trim(),
          dueDate: questData.dueDate,
          type: questData.type,
          description: questData.description || '',
          priority: questData.priority || 'medium',
          category: questData.category || 'general',
          ...(questData.type === 'task' &&
          'goalId' in questData &&
          questData.goalId
            ? { goalId: questData.goalId }
            : {}),
        };

        const response = await api.post('/quests', payload);

        // Add client-side timestamps for immediate UI feedback
        const now = new Date().toISOString();
        return {
          ...response.data,
          createdAt: response.data.createdAt || now,
          updatedAt: response.data.updatedAt || now,
        } as Quest;
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to create quest';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Update a task or goal
   * @param questId - The ID of the quest to update
   * @param type - Whether it's a 'task' or 'goal'
   * @param updateData - Partial update data
   * @returns Promise<Task | Goal>
   */
  async updateQuest(
    questId: string,
    type: 'task' | 'goal',
    updateData: UpdateQuestData
  ): Promise<Quest> {
    if (!questId?.trim()) {
      throw new ApiError(400, 'Quest ID is required');
    }
    if (!type || !['task', 'goal'].includes(type)) {
      throw new ApiError(400, 'Type must be either "task" or "goal"');
    }

    return retryRequest(async () => {
      try {
        const response = await api.put(
          `/quests/${questId}?type=${type}`,
          updateData
        );

        // Add client-side updated timestamp for immediate UI feedback
        return {
          ...response.data,
          updatedAt: response.data.updatedAt || new Date().toISOString(),
        } as Quest;
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(
            404,
            `${type.charAt(0).toUpperCase() + type.slice(1)} not found`
          );
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          `Failed to update ${type}`;
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Delete a task or goal
   * @param questId - The ID of the quest to delete
   * @param type - Whether it's a 'task' or 'goal'
   * @returns Promise<void>
   */
  async deleteQuest(questId: string, type: 'task' | 'goal'): Promise<void> {
    if (!questId?.trim()) {
      throw new ApiError(400, 'Quest ID is required');
    }
    if (!type || !['task', 'goal'].includes(type)) {
      throw new ApiError(400, 'Type must be either "task" or "goal"');
    }

    return retryRequest(async () => {
      try {
        await api.delete(`/quests/${questId}?type=${type}`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(
            404,
            `${type.charAt(0).toUpperCase() + type.slice(1)} not found`
          );
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          `Failed to delete ${type}`;
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Convenience method to fetch today's tasks
   * @returns Promise<Task[]>
   */
  async fetchTodayTasks(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return this.fetchTasksByDate(today);
  },

  /**
   * Convenience method to create a task
   * @param taskData - Task creation data
   * @returns Promise<Task>
   */
  async createTask(taskData: Omit<CreateTaskData, 'type'>): Promise<Task> {
    return this.createQuest({ ...taskData, type: 'task' }) as Promise<Task>;
  },

  /**
   * Convenience method to create a goal
   * @param goalData - Goal creation data
   * @returns Promise<Goal>
   */
  async createGoal(goalData: Omit<CreateGoalData, 'type'>): Promise<Goal> {
    return this.createQuest({ ...goalData, type: 'goal' }) as Promise<Goal>;
  },

  /**
   * Convenience method to update a task
   * @param taskId - The task ID
   * @param updateData - Task update data
   * @returns Promise<Task>
   */
  async updateTask(taskId: string, updateData: UpdateTaskData): Promise<Task> {
    return this.updateQuest(taskId, 'task', updateData) as Promise<Task>;
  },

  /**
   * Convenience method to update a goal
   * @param goalId - The goal ID
   * @param updateData - Goal update data
   * @returns Promise<Goal>
   */
  async updateGoal(goalId: string, updateData: UpdateGoalData): Promise<Goal> {
    return this.updateQuest(goalId, 'goal', updateData) as Promise<Goal>;
  },

  /**
   * Convenience method to delete a task
   * @param taskId - The task ID
   * @returns Promise<void>
   */
  async deleteTask(taskId: string): Promise<void> {
    return this.deleteQuest(taskId, 'task');
  },

  /**
   * Convenience method to delete a goal
   * @param goalId - The goal ID
   * @returns Promise<void>
   */
  async deleteGoal(goalId: string): Promise<void> {
    return this.deleteQuest(goalId, 'goal');
  },

  /**
   * Convenience method to complete a task
   * @param taskId - The task ID
   * @returns Promise<Task>
   */
  async completeTask(taskId: string): Promise<Task> {
    return this.updateTask(taskId, { status: 'completed' });
  },

  /**
   * Convenience method to complete a goal
   * @param goalId - The goal ID
   * @returns Promise<Goal>
   */
  async completeGoal(goalId: string): Promise<Goal> {
    return this.updateGoal(goalId, { status: 'completed' });
  },
};

// Export the API base URL for external use
export const API_BASE =
  'https://dxc20i9fqg.execute-api.us-east-1.amazonaws.com';
