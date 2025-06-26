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
 * Main API client for Task operations
 */
export const tasksApi = {
  /**
   * Fetch tasks for a specific date
   * @param date - Date in YYYY-MM-DD format
   * @returns Promise<Task[]>
   */
  async fetchTasksByDate(date: string): Promise<Task[]> {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) {
      throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
    }

    return retryRequest(async () => {
      try {
        const response = await api.get(`/tasks`, { params: { date } });
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
   * Create a new task
   * @param taskData - Task creation data
   * @returns Promise<Task>
   */
  async createTask(taskData: Omit<CreateTaskData, 'type'>): Promise<Task> {
    // Validate required fields
    if (!taskData.title?.trim()) {
      throw new ApiError(400, 'Title is required');
    }
    if (!taskData.dueDate) {
      throw new ApiError(400, 'Due date is required');
    }
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(taskData.dueDate)) {
      throw new ApiError(400, 'Due date must be in YYYY-MM-DD format');
    }

    return retryRequest(async () => {
      try {
        // Transform the data to match backend expectations
        const payload = {
          taskName: taskData.title.trim(),
          dueDate: taskData.dueDate,
          description: taskData.description || '',
          priority: taskData.priority || 'medium',
          goalId: taskData.goalId,
        };

        const response = await api.post('/tasks', payload);
        return response.data as Task;
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to create task';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Update a task
   * @param taskId - The ID of the task to update
   * @param updateData - Partial update data
   * @returns Promise<Task>
   */
  async updateTask(taskId: string, updateData: UpdateTaskData): Promise<Task> {
    if (!taskId?.trim()) {
      throw new ApiError(400, 'Task ID is required');
    }

    return retryRequest(async () => {
      try {
        const response = await api.put(`/tasks/${taskId}`, updateData);
        return response.data as Task;
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Task not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to update task';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Delete a task
   * @param taskId - The ID of the task to delete
   * @returns Promise<void>
   */
  async deleteTask(taskId: string): Promise<void> {
    if (!taskId?.trim()) {
      throw new ApiError(400, 'Task ID is required');
    }

    return retryRequest(async () => {
      try {
        await api.delete(`/tasks/${taskId}`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Task not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to delete task';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },
};

/**
 * Main API client for Goal operations
 */
export const goalsApi = {
  /**
   * Fetch all goals for the authenticated user
   * @returns Promise<Goal[]>
   */
  async fetchGoals(): Promise<Goal[]> {
    return retryRequest(async () => {
      try {
        const response = await api.get('/goals');
        return response.data.goals as Goal[];
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch goals';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Create a new goal
   * @param goalData - Goal creation data
   * @returns Promise<Goal>
   */
  async createGoal(goalData: Omit<CreateGoalData, 'type'>): Promise<Goal> {
    // Validate required fields
    if (!goalData.title?.trim()) {
      throw new ApiError(400, 'Title is required');
    }
    if (!goalData.dueDate) {
      throw new ApiError(400, 'Target date is required');
    }
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(goalData.dueDate)) {
      throw new ApiError(400, 'Target date must be in YYYY-MM-DD format');
    }

    return retryRequest(async () => {
      try {
        // Transform the data to match backend expectations
        const payload = {
          goalName: goalData.title.trim(),
          targetDate: goalData.dueDate,
          description: goalData.description || '',
          category: goalData.category || 'general',
        };

        const response = await api.post('/goals', payload);
        return response.data as Goal;
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to create goal';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Update a goal
   * @param goalId - The ID of the goal to update
   * @param updateData - Partial update data
   * @returns Promise<Goal>
   */
  async updateGoal(goalId: string, updateData: UpdateGoalData): Promise<Goal> {
    if (!goalId?.trim()) {
      throw new ApiError(400, 'Goal ID is required');
    }

    return retryRequest(async () => {
      try {
        const response = await api.put(`/goals/${goalId}`, updateData);
        return response.data as Goal;
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Goal not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to update goal';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Delete a goal
   * @param goalId - The ID of the goal to delete
   * @returns Promise<void>
   */
  async deleteGoal(goalId: string): Promise<void> {
    if (!goalId?.trim()) {
      throw new ApiError(400, 'Goal ID is required');
    }

    return retryRequest(async () => {
      try {
        await api.delete(`/goals/${goalId}`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Goal not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to delete goal';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },
};

// Export the API base URL for external use
export const API_BASE =
  'https://h5k4oat3hi.execute-api.us-east-1.amazonaws.com';
