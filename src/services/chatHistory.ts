import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChatHistoryMessage,
  ChatHistoryResponse,
  ClearChatResponse,
} from '../types/api';
import api from '../api/axios';

const CACHE_KEY = 'current-chat-messages';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export class ChatHistoryService {
  /**
   * Load chat history from server for current user
   * This restores the user's conversation when they reopen the app or login on another device
   */
  async loadChatHistory(): Promise<ChatHistoryMessage[]> {
    try {
      // Try to fetch from server first (GET /chat-history - no parameters)
      const response = await this.apiCallWithRetry(async () => {
        const result = await api.get('/chat-history');
        return result.data;
      });

      // Support both { messages: [...] } and { data: { messages: [...] } }
      const messages =
        response.messages || (response.data && response.data.messages) || [];
      await this.cacheMessages(messages);

      return messages;
    } catch (error) {
      console.error('Error loading chat history from server:', error);

      // Fallback to cached messages if server fails
      const cachedMessages = await this.getCachedMessages();
      return cachedMessages;
    }
  }

  /**
   * Clear all chat history (both local and server)
   * This is called when user taps the clear/delete button
   */
  async clearChatHistory(): Promise<void> {
    try {
      // Clear local cache first
      await this.clearCachedMessages();

      // Clear on server (DELETE /chat-history - no parameters)
      await this.apiCallWithRetry(async () => {
        const result = await api.delete('/chat-history');
        return result.data;
      });

      console.log('Chat history cleared completely');
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  }

  /**
   * Get cached messages from local storage
   */
  async getCachedMessages(): Promise<ChatHistoryMessage[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) return [];

      const messages: ChatHistoryMessage[] = JSON.parse(cached);
      return messages;
    } catch (error) {
      console.error('Error reading cached messages:', error);
      return [];
    }
  }

  /**
   * Cache messages locally
   */
  async cacheMessages(messages: ChatHistoryMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error caching messages:', error);
    }
  }

  /**
   * Clear cached messages
   */
  async clearCachedMessages(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cached messages:', error);
    }
  }

  /**
   * API call with retry logic
   */
  private async apiCallWithRetry<T>(apiCall: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error as Error;

        if (attempt < MAX_RETRIES - 1) {
          // Exponential backoff
          const delay = RETRY_DELAY * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw lastError!;
  }

  /**
   * Check if there are any cached messages
   */
  async hasCachedMessages(): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached !== null && JSON.parse(cached).length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cache size for debugging
   */
  async getCacheSize(): Promise<number> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? cached.length : 0;
    } catch (error) {
      return 0;
    }
  }
}

// Export singleton instance
export const chatHistoryService = new ChatHistoryService();
