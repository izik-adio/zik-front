import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { storage } from '../utils/storage';
import { AuthTokens } from '../services/cognito';
import { isTokenExpired } from '../utils/jwt';
import { cognitoService } from './cognito';
import {
  EpicQuest,
  DailyQuest,
  GetQuestsResponse,
  CreateQuestRequest,
  UpdateQuestRequest,
  ChatRequest,
  ChatResponse,
  DeleteQuestResponse,
  ApiError,
} from '../types/api';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  constructor() {
    const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
    this.baseURL = isDevMode
      ? 'http://localhost:3000'
      : process.env.EXPO_PUBLIC_API_URL ||
      'https://h5k4oat3hi.execute-api.us-east-1.amazonaws.com/';

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // Increased timeout for AI responses
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }
  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const tokens = await storage.getItem<AuthTokens>('authTokens');

          if (tokens?.AccessToken) {
            config.headers.Authorization = `Bearer ${tokens.AccessToken}`;
          }
        } catch (error) {
          console.error('Error adding auth token to request:', error);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear storage and let AuthContext handle redirect
          await storage.clear();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get authentication headers for fetch requests
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      const tokens = await storage.getItem<AuthTokens>('authTokens');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (tokens?.AccessToken) {
        headers.Authorization = `Bearer ${tokens.AccessToken}`;
      }

      return headers;
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  /**
   * Fetch all tasks and goals for the authenticated user (for dashboard)
   * @param date Optional date filter for Daily Tasks (YYYY-MM-DD)
   */
  async getDashboard(date?: string): Promise<GetQuestsResponse> {
    try {
      // Proactive token expiry check and refresh
      const tokens = await storage.getItem<AuthTokens>('authTokens');
      if (
        tokens?.AccessToken &&
        isTokenExpired(tokens.AccessToken) &&
        tokens.RefreshToken
      ) {
        try {
          const { tokens: newTokens, user } =
            await cognitoService.refreshTokens(tokens.RefreshToken);
          await storage.setItem('authTokens', newTokens);
          await storage.setItem('userData', user);
        } catch (refreshError) {
          await storage.clear();
          throw new Error('Session expired. Please log in again.');
        }
      }
      // Fetch tasks
      const params = date ? { date } : {};
      const tasksResponse: AxiosResponse<any> = await this.api.get('/tasks', {
        params,
      });
      // Fetch goals
      let goalsData: EpicQuest[] = [];
      try {
        const goalsResponse: AxiosResponse<any> = await this.api.get('/goals');
        if (Array.isArray(goalsResponse.data)) {
          goalsData = goalsResponse.data.map((goal: any) => ({
            questId: goal.goalId,
            userId: goal.userId,
            title: goal.goalName,
            description: goal.description || '',
            category: goal.category || 'general',
            status: goal.status,
            targetDate: goal.targetDate,
            roadmapStatus: goal.roadmapStatus || 'none',
            createdAt: goal.createdAt,
            updatedAt: goal.updatedAt,
          }));
        }
      } catch (goalsError) {
        console.warn('Could not fetch goals:', goalsError);
      }
      // Transform tasks
      let dailyQuests: DailyQuest[] = [];
      if (Array.isArray(tasksResponse.data)) {
        dailyQuests = tasksResponse.data.map((task: any) => ({
          questId: task.taskId,
          userId: task.userId,
          epicQuestId: task.goalId,
          title: task.taskName,
          status: task.status,
          dueDate: task.dueDate,
          priority: task.priority || 'medium',
          description: task.description || '',
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        }));
      }
      return { epicQuests: goalsData, dailyQuests };
    } catch (error) {
      console.error('Error fetching quests:', error);

      // Enhanced error logging
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Error status:', axiosError.response?.status);
        console.error('Error data:', axiosError.response?.data);
        console.error('Error headers:', axiosError.response?.headers);
        console.error('Request URL:', axiosError.config?.url);
        console.error('Request method:', axiosError.config?.method);
        console.error('Request headers:', axiosError.config?.headers);
      }

      throw this.handleApiError(error);
    }
  }

  /**
   * Create a new daily task
   */
  async createTask(taskData: any): Promise<DailyQuest> {
    try {
      const payload = {
        taskName: taskData.title,
        dueDate: taskData.dueDate,
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        goalId: taskData.goalId,
      };
      const response: AxiosResponse<any> = await this.api.post(
        '/tasks',
        payload
      );
      return {
        questId: response.data.taskId,
        userId: response.data.userId,
        epicQuestId: response.data.goalId,
        title: response.data.taskName,
        status: response.data.status,
        dueDate: response.data.dueDate,
        priority: response.data.priority,
        description: response.data.description,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Create a new goal
   */
  async createGoal(goalData: any): Promise<EpicQuest> {
    try {
      const payload = {
        goalName: goalData.title,
        targetDate: goalData.dueDate,
        description: goalData.description || '',
        category: goalData.category || 'general',
      };
      const response: AxiosResponse<any> = await this.api.post(
        '/goals',
        payload
      );
      return {
        questId: response.data.goalId,
        userId: response.data.userId,
        title: response.data.goalName,
        description: response.data.description,
        category: response.data.category,
        status: response.data.status,
        targetDate: response.data.targetDate,
        roadmapStatus: response.data.roadmapStatus || 'none',
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Update a daily task
   */
  async updateTask(taskId: string, data: any): Promise<DailyQuest> {
    try {
      const response: AxiosResponse<any> = await this.api.put(
        `/tasks/${taskId}`,
        data
      );
      return {
        questId: response.data.taskId,
        userId: response.data.userId,
        epicQuestId: response.data.goalId,
        title: response.data.taskName,
        status: response.data.status,
        dueDate: response.data.dueDate,
        priority: response.data.priority,
        description: response.data.description,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Update a goal
   */
  async updateGoal(goalId: string, data: any): Promise<EpicQuest> {
    try {
      const response: AxiosResponse<any> = await this.api.put(
        `/goals/${goalId}`,
        data
      );
      return {
        questId: response.data.goalId,
        userId: response.data.userId,
        title: response.data.goalName,
        description: response.data.description,
        category: response.data.category,
        status: response.data.status,
        targetDate: response.data.targetDate,
        roadmapStatus: response.data.roadmapStatus || 'none',
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Delete a daily task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.api.delete(`/tasks/${taskId}`);
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string): Promise<void> {
    try {
      await this.api.delete(`/goals/${goalId}`);
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Send a chat message with streaming response support
   * This function handles real-time streaming of AI responses, calling callbacks
   * for each chunk received to enable live "typing" effect in the UI.
   *
   * @param message The message to send to the AI
   * @param onChunk Callback function called for each chunk of the streaming response
   * @param onComplete Callback function called when the stream is complete
   * @param onError Callback function called if an error occurs
   */ async postChatMessage(
    message: string,
    onChunk?: (chunk: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    // Force fallback method for React Native environments
    await this.postChatMessageWithFallback(
      message,
      onChunk,
      onComplete,
      onError
    );
  }
  /**
   * Send a non-streaming chat message (fallback)
   */ async postChatMessageSync(message: string): Promise<ChatResponse> {
    try {
      const chatRequest: ChatRequest = { message };
      const response: AxiosResponse<ChatResponse> = await this.api.post(
        '/chat',
        chatRequest
      );

      return response.data;
    } catch (error) {
      console.error('Error sending chat message:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Error response status:', axiosError.response?.status);
        console.error('Error response data:', axiosError.response?.data);
      }
      throw this.handleApiError(error);
    }
  }

  /**
   * Handle API errors and convert to user-friendly format
   */
  private handleApiError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = error.response.data;
      return new Error(
        apiError.error || 'An error occurred while processing your request'
      );
    } else if (error.request) {
      // Request was made but no response received
      return new Error(
        'Unable to connect to the server. Please check your internet connection.'
      );
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  /**
   * Convenience method to mark a quest as complete
   */
  async markTaskComplete(taskId: string): Promise<DailyQuest> {
    return this.updateTask(taskId, { status: 'completed' });
  }
  async markGoalComplete(goalId: string): Promise<EpicQuest> {
    return this.updateGoal(goalId, { status: 'completed' });
  }

  /**
   * Convenience method to get today's daily quests
   */
  async getTodayQuests(): Promise<GetQuestsResponse> {
    const today = new Date().toISOString().split('T')[0];
    return this.getDashboard(today);
  }

  /**
   * Check if the current environment supports streaming
   */
  private isStreamingSupported(): boolean {
    try {
      // Check if we're in React Native
      if (
        typeof navigator !== 'undefined' &&
        navigator.product === 'ReactNative'
      ) {
        return false; // React Native doesn't fully support streaming
      }

      // Check if ReadableStream is available
      return (
        typeof ReadableStream !== 'undefined' &&
        typeof Response !== 'undefined' &&
        'body' in Response.prototype
      );
    } catch (error) {
      return false;
    }
  }
  /**
   * Fallback method that simulates streaming by using sync API
   */ private async postChatMessageWithFallback(
    message: string,
    onChunk?: (chunk: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      // Use the sync API method
      const response = await this.postChatMessageSync(message);
      const fullText = response.response || '';

      // Simulate typing effect by sending the complete response
      // The typewriter effect will be handled by the UI component
      if (onChunk && fullText) {
        // Send the complete text immediately - the typewriter hook will handle the typing effect
        const jsonChunk = JSON.stringify({ response: fullText });
        onChunk(jsonChunk);
      }

      // Send final response
      const finalJson = JSON.stringify({ response: fullText });
      onComplete?.(finalJson);
    } catch (error) {
      console.error('Error in fallback chat method:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error(
          '📊 [API FALLBACK] Error response status:',
          axiosError.response?.status
        );
        console.error(
          '📊 [API FALLBACK] Error response data:',
          axiosError.response?.data
        );
      }
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }
  /**
   * Fetch all Epic Quests (goals) for the authenticated user
   */ async getGoals(): Promise<EpicQuest[]> {
    try {
      const response: AxiosResponse<any> = await this.api.get(
        '/goals'
      );

      if (response.data && response.data.goals) {
        const goalsData = response.data.goals;

        // Transform goals to epic quests format
        const epicQuests: EpicQuest[] = goalsData.map((goal: any) => ({
          questId: goal.goalId,
          userId: goal.userId,
          title: goal.goalName,
          description: goal.description || '',
          category: goal.category || 'general',
          status:
            goal.status === 'completed'
              ? 'completed'
              : goal.status === 'paused'
                ? 'paused'
                : 'active',
          targetDate: goal.targetDate,
          roadmapStatus: goal.roadmapStatus || 'none',
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt,
        }));

        return epicQuests;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw this.handleApiError(error);
    }
  }
}

// Export a singleton instance
export const apiService = new ApiService();
export default apiService;
