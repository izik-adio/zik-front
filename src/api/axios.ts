import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { cognitoService, AuthTokens } from '../services/cognito';

const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// AWS HTTP API v2 endpoint
const API_BASE = 'https://h5k4oat3hi.execute-api.us-east-1.amazonaws.com';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
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
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // In dev mode, return mock data for certain endpoints
    if (isDevMode && response.config.url) {
      // Mock tasks by date
      if (
        response.config.url.includes('/quests') &&
        response.config.url.includes('date=')
      ) {
        const mockTasks = [
          {
            taskId: 'mock-task-1',
            userId: 'mock-user-id',
            taskName: 'Complete project documentation',
            description: 'Write comprehensive API documentation',
            dueDate: new Date().toISOString().split('T')[0],
            priority: 'high',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            taskId: 'mock-task-2',
            userId: 'mock-user-id',
            taskName: 'Review code changes',
            description: 'Review pull requests and provide feedback',
            dueDate: new Date().toISOString().split('T')[0],
            priority: 'medium',
            status: 'in-progress',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        return { ...response, data: mockTasks };
      }
      // Mock quest creation
      if (
        response.config.url.includes('/quests') &&
        response.config.method === 'post'
      ) {
        const requestData = JSON.parse(response.config.data || '{}');
        const mockQuest = {
          ...(requestData.type === 'task'
            ? {
              taskId: 'mock-task-' + Date.now(),
              taskName: requestData.title,
            }
            : {
              goalId: 'mock-goal-' + Date.now(),
              goalName: requestData.title,
              targetDate: requestData.dueDate,
              category: requestData.category,
            }),
          userId: 'mock-user-id',
          description: requestData.description,
          ...(requestData.type === 'task'
            ? {
              dueDate: requestData.dueDate,
              priority: requestData.priority,
              status: 'pending',
            }
            : {
              status: 'active',
            }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { ...response, data: mockQuest };
      }
      // Profile endpoints now use real API calls - no mocking
      // Quest and Goals endpoints now use real API calls - no mocking
      // Profile endpoints now use real API calls - no mocking
    }
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;

    // Check if the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('Attempting to refresh auth token...');
        const newTokens = await cognitoService.refreshSession();

        if (newTokens) {
          console.log('Token refreshed successfully');
          // Update the header for the original request
          originalRequest.headers.Authorization = `Bearer ${newTokens.AccessToken}`;
          // Retry the original request
          return api(originalRequest);
        } else {
          console.log('Token refresh failed, logging out.');
          await cognitoService.logout();
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      } catch (refreshError) {
        console.error('Error during token refresh:', refreshError);
        await cognitoService.logout();
        return Promise.reject(refreshError);
      }
    }

    // In dev mode, only return mock responses for specific cases
    if (isDevMode && originalRequest?.url) {
      // All API endpoints now use real backend - no mocking in dev mode
      // This ensures all requests go to the actual API
    }

    // For other errors, just reject
    return Promise.reject(error);
  }
);

// Mock response function for development mode
function getMockResponse(method: string, url: string, data?: any) {
  if (!isDevMode) return null;

  // Parse request data if it's a string
  let requestData = data;
  if (typeof data === 'string') {
    try {
      requestData = JSON.parse(data);
    } catch {
      requestData = {};
    }
  }

  // Profile endpoints - no mocking, use real API
  // This ensures profile requests always go to the actual backend

  // Quest endpoints
  if (url.includes('/quests')) {
    if (url.includes('date=')) {
      // Mock tasks by date
      return [
        {
          taskId: 'mock-task-1',
          userId: 'mock-user-id',
          taskName: 'Complete project documentation',
          taskDescription: 'Finish writing the documentation for the new feature',
          category: 'work',
          isCompleted: false,
          dueDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    } else if (url.match(/\/quests\/[^\/]+$/)) {
      // Mock single quest
      return {
        questId: 'mock-quest-1',
        userId: 'mock-user-id',
        questName: 'Learn TypeScript',
        questDescription: 'Master TypeScript fundamentals',
        milestones: Array.from({ length: 5 }, (_, i) => ({
          milestoneId: `milestone-${i + 1}`,
          questId: 'mock-quest-1',
          milestoneName: `Milestone ${i + 1}`,
          milestoneDescription: `Complete milestone ${i + 1}`,
          isCompleted: i < 2,
          orderIndex: i,
          tasks: Array.from({ length: 3 }, (_, j) => ({
            taskId: `task-${i + 1}-${j + 1}`,
            milestoneId: `milestone-${i + 1}`,
            taskName: `Task ${j + 1} for Milestone ${i + 1}`,
            taskDescription: `Complete task ${j + 1}`,
            isCompleted: i < 2 || (i === 2 && j === 0),
            orderIndex: j,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Mock quest list
      return [];
    }
  }

  // Goals and Quest endpoints now use real API - no mocking

  return null;
}

export default api;
