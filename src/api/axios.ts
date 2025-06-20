import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { cognitoService, AuthTokens } from '../services/cognito';
import { Platform } from 'react-native';

const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

const api = axios.create({
  baseURL: isDevMode ? 'http://localhost:3000' : (process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com'),
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
      if (tokens?.IdToken) {
        config.headers.Authorization = `Bearer ${tokens.IdToken}`;
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
      if (response.config.url.includes('/goals')) {
        return { ...response, data: [] };
      }
      if (response.config.url.includes('/quests')) {
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
          }
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
          const { tokens: newTokens, user } = await cognitoService.refreshTokens(tokens.RefreshToken);
          
          await storage.setItem('authTokens', newTokens);
          await storage.setItem('userData', user);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.IdToken}`;
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