import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { cognitoService, AuthTokens } from '../services/cognito';
import { triggerGlobalLogout } from '../utils/authUtils';

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
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer ***' : undefined,
      },
    });
    return config;
  },
  (error) => {
    console.error('🌐 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response logging
api.interceptors.response.use(
  (response) => {
    console.log(`🌐 API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    console.error('🌐 API Response Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
      },
    });
    return Promise.reject(error);
  }
);
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
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;

    // Check if the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('Received 401 error, attempting token refresh');
      try {
        const newTokens = await cognitoService.refreshSession();
        
        if (newTokens) {
          console.log('Token refreshed successfully');
          // Update the header for the original request
          originalRequest.headers.Authorization = `Bearer ${newTokens.AccessToken}`;
          // Retry the original request
          return api(originalRequest);
        } else {
          console.log('Token refresh failed, logging out.');
          // Use global logout to ensure auth context is updated
          await triggerGlobalLogout();
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      } catch (refreshError) {
        console.error('Error during token refresh:', refreshError);
        // Use the global logout to ensure auth context is updated
        await triggerGlobalLogout();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      console.log('Received 401 error outside of retry logic, triggering logout');
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