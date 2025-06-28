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
 * DailyQuest interface aligned with unified data model
 */
export interface DailyQuest {
  questId: string; // Renamed from taskId
  userId: string;
  title: string; // Renamed from taskName
  description: string;
  dueDate: string; // YYYY-MM-DD format
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  epicQuestId?: string; // Renamed from goalId
  milestoneId?: string; // Optional link to a milestone
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

/**
 * EpicQuest interface aligned with unified data model
 */
export interface EpicQuest {
  questId: string; // Renamed from goalId
  userId: string;
  title: string; // Renamed from goalName
  description: string;
  targetDate: string; // YYYY-MM-DD format
  category: string;
  status: 'active' | 'completed' | 'paused';
  roadmapStatus: 'none' | 'generating' | 'ready' | 'error'; // Enhanced roadmap generation status
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

// Legacy interfaces for backward compatibility
/** @deprecated Use DailyQuest instead */
export interface Task extends Omit<DailyQuest, 'questId' | 'title' | 'epicQuestId'> {
  taskId: string;
  taskName: string;
  goalId?: string;
}

/** @deprecated Use EpicQuest instead */
export interface Goal extends Omit<EpicQuest, 'questId' | 'title'> {
  goalId: string;
  goalName: string;
}

/**
 * Milestone interface for Epic Quest roadmaps
 */
export interface Milestone {
  milestoneId: string;
  epicQuestId: string; // Renamed from epicId
  sequence: number; // Order of the milestone (1, 2, 3...)
  title: string;
  description: string;
  status: 'locked' | 'active' | 'completed';
  durationInDays: number;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

/**
 * Union type for quest operations
 */
export type Quest = DailyQuest | EpicQuest;

/**
 * Create DailyQuest request payload
 */
export interface CreateDailyQuestData {
  title: string;
  dueDate: string; // YYYY-MM-DD format
  type: 'daily';
  description: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  epicQuestId?: string; // Optional link to an epic quest
  milestoneId?: string; // Optional link to a milestone
}

/**
 * Create EpicQuest request payload
 */
export interface CreateEpicQuestData {
  title: string;
  targetDate: string; // YYYY-MM-DD format (corrected field name)
  type: 'epic';
  description: string;
  priority?: 'low' | 'medium' | 'high';
  category: string;
}

/**
 * Union type for creation payloads
 */
export type CreateQuestData = CreateDailyQuestData | CreateEpicQuestData;

/**
 * Update DailyQuest request payload
 */
export interface UpdateDailyQuestData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in-progress' | 'completed';
  epicQuestId?: string;
}

/**
 * Update EpicQuest request payload
 */
export interface UpdateEpicQuestData {
  title?: string;
  description?: string;
  category?: string;
  status?: 'active' | 'completed' | 'paused';
}

/**
 * Union type for update payloads
 */
export type UpdateQuestData = UpdateDailyQuestData | UpdateEpicQuestData;

// Legacy types for backward compatibility
/** @deprecated Use CreateDailyQuestData instead */
export interface CreateTaskData extends Omit<CreateDailyQuestData, 'type' | 'epicQuestId'> {
  type: 'task';
  goalId?: string;
}

/** @deprecated Use CreateEpicQuestData instead */
export interface CreateGoalData extends Omit<CreateEpicQuestData, 'type' | 'targetDate'> {
  type: 'goal';
  dueDate: string;
}

/** @deprecated Use UpdateDailyQuestData instead */
export interface UpdateTaskData extends Omit<UpdateDailyQuestData, 'epicQuestId'> {
  goalId?: string;
}

/** @deprecated Use UpdateEpicQuestData instead */
export interface UpdateGoalData extends UpdateEpicQuestData { }

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
 * Main API client for DailyQuest operations
 */
export const dailyQuestsApi = {
  /**
   * Fetch daily quests for a specific date
   * @param date - Date in YYYY-MM-DD format
   * @returns Promise<DailyQuest[]>
   */
  async fetchDailyQuestsByDate(date: string): Promise<DailyQuest[]> {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) {
      throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
    }

    return retryRequest(async () => {
      try {
        const response = await api.get(`/tasks`, { params: { date } });

        // Debug logging to understand response structure
        console.log('Tasks API response:', {
          status: response.status,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          dataKeys: response.data ? Object.keys(response.data) : 'null',
          data: response.data
        });

        // Handle different response structures
        let tasks: Task[];
        if (Array.isArray(response.data)) {
          tasks = response.data;
        } else if (response.data && Array.isArray(response.data.tasks)) {
          tasks = response.data.tasks;
        } else if (response.data && Array.isArray(response.data.data)) {
          tasks = response.data.data;
        } else {
          // If no tasks found, return empty array
          console.warn('No tasks found in response. Response structure:', {
            type: typeof response.data,
            keys: response.data ? Object.keys(response.data) : null,
            value: response.data
          });
          return [];
        }

        // Transform legacy response to new format
        return tasks.map(task => ({
          questId: task.taskId,
          userId: task.userId,
          title: task.taskName,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
          epicQuestId: task.goalId,
          milestoneId: task.milestoneId,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        }));
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch daily quests';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Create a new daily quest
   * @param questData - DailyQuest creation data
   * @returns Promise<DailyQuest>
   */
  async createDailyQuest(questData: Omit<CreateDailyQuestData, 'type'>): Promise<DailyQuest> {
    // Validate required fields
    if (!questData.title?.trim()) {
      throw new ApiError(400, 'Title is required');
    }
    if (!questData.dueDate) {
      throw new ApiError(400, 'Due date is required');
    }
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(questData.dueDate)) {
      throw new ApiError(400, 'Due date must be in YYYY-MM-DD format');
    }

    return retryRequest(async () => {
      try {
        // Transform the data to match backend expectations
        const payload = {
          taskName: questData.title.trim(),
          dueDate: questData.dueDate,
          description: questData.description || '',
          priority: questData.priority || 'medium',
          goalId: questData.epicQuestId,
          milestoneId: questData.milestoneId,
        };

        const response = await api.post('/tasks', payload);
        const task = response.data as Task;
        // Transform response to new format
        return {
          questId: task.taskId,
          userId: task.userId,
          title: task.taskName,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
          epicQuestId: task.goalId,
          milestoneId: task.milestoneId,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to create daily quest';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Update a daily quest
   * @param questId - The ID of the quest to update
   * @param updateData - Partial update data
   * @returns Promise<DailyQuest>
   */
  async updateDailyQuest(questId: string, updateData: UpdateDailyQuestData): Promise<DailyQuest> {
    if (!questId?.trim()) {
      throw new ApiError(400, 'Quest ID is required');
    }

    return retryRequest(async () => {
      try {
        // Transform update data to legacy format
        const legacyUpdateData = {
          ...updateData,
          goalId: updateData.epicQuestId,
        };
        delete (legacyUpdateData as any).epicQuestId;

        const response = await api.put(`/tasks/${questId}`, legacyUpdateData);
        const task = response.data as Task;
        // Transform response to new format
        return {
          questId: task.taskId,
          userId: task.userId,
          title: task.taskName,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
          epicQuestId: task.goalId,
          milestoneId: task.milestoneId,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Daily quest not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to update daily quest';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Delete a daily quest
   * @param questId - The ID of the quest to delete
   * @returns Promise<void>
   */
  async deleteDailyQuest(questId: string): Promise<void> {
    if (!questId?.trim()) {
      throw new ApiError(400, 'Quest ID is required');
    }

    return retryRequest(async () => {
      try {
        await api.delete(`/tasks/${questId}`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Daily quest not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to delete daily quest';
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
 * Main API client for EpicQuest operations
 */
export const epicQuestsApi = {
  /**
   * Fetch all epic quests for the authenticated user
   * @returns Promise<EpicQuest[]>
   */
  async fetchEpicQuests(): Promise<EpicQuest[]> {
    return retryRequest(async () => {
      try {
        const response = await api.get('/goals');

        // Debug logging to understand response structure
        console.log('Goals API response:', {
          status: response.status,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          dataKeys: response.data ? Object.keys(response.data) : 'null',
          data: response.data
        });

        // Handle different response structures
        let goals: Goal[];
        if (Array.isArray(response.data)) {
          goals = response.data;
        } else if (response.data && Array.isArray(response.data.goals)) {
          goals = response.data.goals;
        } else if (response.data && Array.isArray(response.data.data)) {
          goals = response.data.data;
        } else {
          // If no goals found, return empty array
          console.warn('No goals found in response. Response structure:', {
            type: typeof response.data,
            keys: response.data ? Object.keys(response.data) : null,
            value: response.data
          });
          return [];
        }

        // Transform legacy response to new format
        return goals.map(goal => ({
          questId: goal.goalId,
          userId: goal.userId,
          title: goal.goalName,
          description: goal.description,
          targetDate: goal.targetDate,
          category: goal.category,
          status: goal.status,
          roadmapStatus: goal.roadmapStatus,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt,
        }));
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch epic quests';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Create a new epic quest
   * @param questData - EpicQuest creation data
   * @returns Promise<EpicQuest>
   */
  async createEpicQuest(questData: Omit<CreateEpicQuestData, 'type'>): Promise<EpicQuest> {
    // Validate required fields
    if (!questData.title?.trim()) {
      throw new ApiError(400, 'Title is required');
    }
    if (!questData.targetDate) {
      throw new ApiError(400, 'Target date is required');
    }
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(questData.targetDate)) {
      throw new ApiError(400, 'Target date must be in YYYY-MM-DD format');
    }

    return retryRequest(async () => {
      try {
        // Transform the data to match backend expectations
        const payload = {
          goalName: questData.title.trim(),
          targetDate: questData.targetDate,
          description: questData.description || '',
          category: questData.category || 'general',
        };

        const response = await api.post('/goals', payload);
        const goal = response.data as Goal;
        // Transform response to new format
        return {
          questId: goal.goalId,
          userId: goal.userId,
          title: goal.goalName,
          description: goal.description,
          targetDate: goal.targetDate,
          category: goal.category,
          status: goal.status,
          roadmapStatus: goal.roadmapStatus,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt,
        };
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to create epic quest';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Update an epic quest
   * @param questId - The ID of the quest to update
   * @param updateData - Partial update data
   * @returns Promise<EpicQuest>
   */
  async updateEpicQuest(questId: string, updateData: UpdateEpicQuestData): Promise<EpicQuest> {
    if (!questId?.trim()) {
      throw new ApiError(400, 'Quest ID is required');
    }

    return retryRequest(async () => {
      try {
        const response = await api.put(`/goals/${questId}`, updateData);
        const goal = response.data as Goal;
        // Transform response to new format
        return {
          questId: goal.goalId,
          userId: goal.userId,
          title: goal.goalName,
          description: goal.description,
          targetDate: goal.targetDate,
          category: goal.category,
          status: goal.status,
          roadmapStatus: goal.roadmapStatus,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt,
        };
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Epic quest not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to update epic quest';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Delete an epic quest
   * @param questId - The ID of the quest to delete
   * @returns Promise<void>
   */
  async deleteEpicQuest(questId: string): Promise<void> {
    if (!questId?.trim()) {
      throw new ApiError(400, 'Quest ID is required');
    }

    return retryRequest(async () => {
      try {
        await api.delete(`/goals/${questId}`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Epic quest not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to delete epic quest';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Fetch a specific epic quest by ID
   * @param questId - Quest ID
   * @returns Promise<EpicQuest>
   */
  async getEpicQuestById(questId: string): Promise<EpicQuest> {
    return retryRequest(async () => {
      try {
        const response = await api.get(`/goals/${questId}`);
        const goal = response.data as Goal;
        // Transform response to new format
        return {
          questId: goal.goalId,
          userId: goal.userId,
          title: goal.goalName,
          description: goal.description,
          targetDate: goal.targetDate,
          category: goal.category,
          status: goal.status,
          roadmapStatus: goal.roadmapStatus,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt,
        };
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Epic quest not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch epic quest';
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
 * Main API client for Roadmap and Milestone operations
 */
export const roadmapApi = {
  /**
   * Fetch roadmap for a specific epic quest
   * @param epicQuestId - Epic Quest ID
   * @returns Promise<Milestone[]>
   */
  async fetchRoadmap(epicQuestId: string): Promise<Milestone[]> {
    return retryRequest(async () => {
      try {
        const response = await api.get(`/goals/${epicQuestId}/milestones`);

        // Handle the API response structure
        let milestones: any[];
        if (response.data && Array.isArray(response.data.milestones)) {
          milestones = response.data.milestones;
        } else if (Array.isArray(response.data)) {
          milestones = response.data;
        } else {
          milestones = [];
        }

        // Transform legacy response to new format
        return milestones.map(milestone => ({
          ...milestone,
          epicQuestId: milestone.epicId || epicQuestId,
        }));
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Epic quest milestones not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch roadmap';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Generate roadmap for a specific epic quest
   * @param epicQuestId - Epic Quest ID
   * @returns Promise<void>
   */
  async generateRoadmap(epicQuestId: string): Promise<void> {
    return retryRequest(async () => {
      try {
        await api.post(`/goals/${epicQuestId}/generate-roadmap`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Epic quest not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to generate roadmap';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Fetch daily quests for a specific milestone
   * This method filters tasks by milestone ID from the existing tasks endpoint
   * since /milestones/{milestoneId}/daily-quests doesn't exist in the backend
   * @param milestoneId - Milestone ID
   * @param date - Date to fetch tasks for (defaults to today)
   * @returns Promise<DailyQuest[]>
   */
  async fetchMilestoneQuests(milestoneId: string, date?: string): Promise<DailyQuest[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const allTasks = await dailyQuestsApi.fetchDailyQuestsByDate(targetDate);

      // Filter tasks that belong to the specified milestone
      return allTasks.filter(task => task.milestoneId === milestoneId);
    } catch (error: any) {
      console.error('Failed to fetch milestone quests:', error);
      throw new ApiError(
        error.response?.status || 500,
        'Failed to fetch milestone quests',
        error.response?.data
      );
    }
  },

  /**
   * Update milestone status
   * @param epicQuestId - Epic Quest ID
   * @param milestoneId - Milestone ID
   * @param status - New status
   * @returns Promise<Milestone>
   */
  async updateMilestoneStatus(epicQuestId: string, milestoneId: string, status: 'locked' | 'active' | 'completed'): Promise<Milestone> {
    return retryRequest(async () => {
      try {
        const response = await api.patch(`/milestones/${milestoneId}`, {
          status
        });
        const milestone = response.data;
        // Transform response to new format
        return {
          ...milestone,
          epicQuestId: milestone.epicId || epicQuestId,
        };
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Milestone not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to update milestone status';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },

  /**
   * Complete a milestone
   * @param milestoneId - Milestone ID
   * @returns Promise<Milestone>
   */
  async completeMilestone(milestoneId: string): Promise<Milestone> {
    return retryRequest(async () => {
      try {
        const response = await api.patch(`/milestones/${milestoneId}`, {
          status: 'completed'
        });
        const milestone = response.data;
        // Transform response to new format
        return {
          ...milestone,
          epicQuestId: milestone.epicId,
        };
      } catch (error: any) {
        if (error.response?.status === 401) {
          await handleUnauthorized();
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, 'Milestone not found');
        }

        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to complete milestone';
        throw new ApiError(
          error.response?.status || 500,
          message,
          error.response?.data
        );
      }
    });
  },
};

// Legacy API exports for backward compatibility
export const tasksApi = {
  fetchTasksByDate: dailyQuestsApi.fetchDailyQuestsByDate,
  createTask: dailyQuestsApi.createDailyQuest,
  updateTask: dailyQuestsApi.updateDailyQuest,
  deleteTask: dailyQuestsApi.deleteDailyQuest,
};

export const goalsApi = {
  fetchGoals: epicQuestsApi.fetchEpicQuests,
  createGoal: epicQuestsApi.createEpicQuest,
  updateGoal: epicQuestsApi.updateEpicQuest,
  deleteGoal: epicQuestsApi.deleteEpicQuest,
  fetchGoalById: epicQuestsApi.getEpicQuestById,
};

// Export the API base URL for external use
export const API_BASE =
  'https://h5k4oat3hi.execute-api.us-east-1.amazonaws.com';
