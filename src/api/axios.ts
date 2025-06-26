import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { cognitoService, AuthTokens } from '../services/cognito';

const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// AWS HTTP API v2 endpoint
const API_BASE = 'https://h5k4oat3hi.execute-api.us-east-1.amazonaws.com';

const api = axios.create({
  baseURL: isDevMode ? 'http://localhost:3000' : API_BASE,
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
      // Keep legacy endpoints for backward compatibility during migration
      if (response.config.url.includes('/goals')) {
        return { ...response, data: [] };
      }
      if (
        response.config.url.includes('/quests') &&
        !response.config.url.includes('date=')
      ) {
        return { ...response, data: [] };
      }
      if (response.config.url.includes('/profile')) {
        return {
          ...response,
          data: {
            userId: 'mock-user-id',
            userName: 'Demo User',
            email: 'demo@example.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      }
    }
    return response;
  },
  async (error) => {
    // In dev mode, return mock data instead of errors
    if (isDevMode) {
      const mockResponse = {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config,
      };
      return Promise.resolve(mockResponse);
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = await storage.getItem<AuthTokens>('authTokens');
        if (tokens?.RefreshToken) {
          const { tokens: newTokens, user } =
            await cognitoService.refreshTokens(tokens.RefreshToken);

          await storage.setItem('authTokens', newTokens);
          await storage.setItem('userData', user);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.AccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        await storage.clear();
        // Note: Navigation should be handled by AuthContext
        console.error('Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
