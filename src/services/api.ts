import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { storage } from '../utils/storage';
import { AuthTokens } from '../services/cognito';
import {
  EpicQuest,
  DailyQuest,
  GetQuestsResponse,
  GetGoalsResponse,
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
        'https://dxc20i9fqg.execute-api.us-east-1.amazonaws.com/';

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
   * Fetch all quests for the authenticated user
   * @param date Optional date filter for Daily Quests (YYYY-MM-DD)
   */ async getQuests(date?: string): Promise<GetQuestsResponse> {
    try {
      const params = date ? { date } : {};

      // Check auth token
      const tokens = await storage.getItem<AuthTokens>('authTokens');

      // Fetch tasks
      const response: AxiosResponse<any> = await this.api.get('/quests', {
        params,
      });

      // Try to fetch goals/epic quests separately
      let goalsData: GetGoalsResponse['goals'] = [];
      try {
        const goalsResponse: AxiosResponse<GetGoalsResponse> =
          await this.api.get('/goals');

        // Handle the new backend response format
        if (goalsResponse.data && goalsResponse.data.goals) {
          goalsData = goalsResponse.data.goals;
        } else {
          goalsData = [];
        }
      } catch (goalsError) {
        console.warn('Could not fetch goals:', goalsError);
        // Continue without goals - they'll be empty
      } // Transform the response to match our expected format
      let transformedResponse: GetQuestsResponse;
      if (response.data.tasks) {
        // API returns { date, tasks } format - transform to our expected format
        const tasks = response.data.tasks; // Convert goals data to epic quests using the new backend format
        const epicQuests: EpicQuest[] = goalsData.map((goal) => ({
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
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt,
        }));

        // Separate tasks into daily quests
        const dailyQuests: DailyQuest[] = [];

        tasks.forEach((task: any) => {
          const dailyQuest: DailyQuest = {
            questId: task.taskId,
            userId: task.userId,
            title: task.taskName,
            status:
              task.status === 'pending'
                ? 'pending'
                : task.status === 'completed'
                ? 'completed'
                : 'in-progress',
            dueDate: task.dueDate,
            priority: task.priority || 'medium',
            description: task.description || '',
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          };

          // Add epicId if task is linked to a goal
          if (task.goalId) {
            dailyQuest.epicId = task.goalId;
          }

          dailyQuests.push(dailyQuest);
        });
        transformedResponse = {
          epicQuests,
          dailyQuests,
        };
      } else if (response.data.epicQuests && response.data.dailyQuests) {
        // Already in correct format
        transformedResponse = response.data;
      } else {
        // Fallback - create empty response
        transformedResponse = {
          epicQuests: [],
          dailyQuests: [],
        };
      }

      return transformedResponse;
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
   * Create a new quest (Epic Quest or Daily Quest)
   */
  async createQuest(
    questData: CreateQuestRequest
  ): Promise<EpicQuest | DailyQuest> {
    try {
      const response: AxiosResponse<EpicQuest | DailyQuest> =
        await this.api.post('/quests', questData);
      return response.data;
    } catch (error) {
      console.error('Error creating quest:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Update a specific quest
   */
  async updateQuest(
    questId: string,
    questData: UpdateQuestRequest,
    type: 'goal' | 'task'
  ): Promise<EpicQuest | DailyQuest> {
    try {
      const response: AxiosResponse<EpicQuest | DailyQuest> =
        await this.api.put(`/quests/${questId}`, questData, {
          params: { type },
        });
      return response.data;
    } catch (error) {
      console.error('Error updating quest:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Delete a specific quest
   */
  async deleteQuest(
    questId: string,
    type: 'goal' | 'task'
  ): Promise<DeleteQuestResponse> {
    try {
      const response: AxiosResponse<DeleteQuestResponse> =
        await this.api.delete(`/quests/${questId}`, { params: { type } });
      return response.data;
    } catch (error) {
      console.error('Error deleting quest:', error);
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
  async markQuestComplete(
    questId: string,
    type: 'goal' | 'task'
  ): Promise<EpicQuest | DailyQuest> {
    return this.updateQuest(questId, { status: 'completed' }, type);
  }

  /**
   * Convenience method to get today's daily quests
   */
  async getTodayQuests(): Promise<GetQuestsResponse> {
    const today = new Date().toISOString().split('T')[0];
    return this.getQuests(today);
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
      const response: AxiosResponse<GetGoalsResponse> = await this.api.get(
        '/goals'
      );

      if (response.data && response.data.goals) {
        const goalsData = response.data.goals;

        // Transform goals to epic quests format
        const epicQuests: EpicQuest[] = goalsData.map((goal) => ({
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
