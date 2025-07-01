import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { cognitoService, AuthTokens } from '../services/cognito';
import { triggerGlobalLogout } from '../utils/authRedirect';

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

// Add request logging
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response logging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const tokens = await storage.getItem<AuthTokens>('authTokens');
      if (tokens?.AccessToken) {
        console.log('Adding auth token to request:', config.url);
        config.headers.Authorization = `Bearer ${tokens.AccessToken}`;
      } else {
        console.log('No auth token found for request:', config.url);
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
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;

    // Check if the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newTokens = await cognitoService.refreshSession();

        if (newTokens) {
          // Update the header for the original request
          originalRequest.headers.Authorization = `Bearer ${newTokens.AccessToken}`;
          // Retry the original request
          return api(originalRequest);
        } else {
          await storage.clear();
          await triggerGlobalLogout();
          return Promise.reject(
            new Error('Session expired. Please log in again.')
          );
        }
      } catch (refreshError) {
        await storage.clear();
        await triggerGlobalLogout();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      await storage.clear();
      await triggerGlobalLogout();
    }

    // For all errors, reject with the original error
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
          taskDescription:
            'Finish writing the documentation for the new feature',
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
