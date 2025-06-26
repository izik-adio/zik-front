import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { useTaskGoalStore } from './questStore';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'zik';
  timestamp: string;
  isStreaming?: boolean;
}

interface ChatState {
  // Data
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  isRefreshingQuests: boolean;
  error: string | null;
  currentStreamingMessageId: string | null;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateStreamingMessage: (messageId: string, content: string) => void;
  finishStreaming: (messageId: string) => void;
  clearError: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [
        {
          id: 'initial',
          content:
            "Hi! I'm Zik, your personal growth companion. How are you feeling today?",
          sender: 'zik',
          timestamp: new Date().toISOString(),
        },
      ],
      isLoading: false,
      isStreaming: false,
      isRefreshingQuests: false,
      error: null,
      currentStreamingMessageId: null, // Actions
      sendMessage: async (message: string) => {
        const { addMessage, updateStreamingMessage, finishStreaming } = get();

        // Add user message
        addMessage({
          content: message,
          sender: 'user',
        });

        // Add empty AI message that will be streamed
        const aiMessageId = addMessage({
          content: '',
          sender: 'zik',
          isStreaming: true,
        });

        set({
          isLoading: true,
          isStreaming: true,
          error: null,
          currentStreamingMessageId: aiMessageId,
        });

        try {
          await apiService.postChatMessage(
            message,
            // onChunk callback - simpler approach for typewriter effect
            (chunk: string) => {
              try {
                // Try to parse as JSON first
                const parsed = JSON.parse(chunk);
                if (parsed.response) {
                  // Update message content for typewriter effect
                  set((state) => ({
                    messages: state.messages.map((msg) =>
                      msg.id === aiMessageId
                        ? {
                            ...msg,
                            content: parsed.response,
                            isStreaming: true,
                          }
                        : msg
                    ),
                  }));
                }
              } catch (parseError) {
                // Treat as plain text if JSON parsing fails
                set((state) => ({
                  messages: state.messages.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: chunk, isStreaming: true }
                      : msg
                  ),
                }));
              }
            },
            // onComplete callback
            async (fullResponse: string) => {
              try {
                // Parse final response
                const parsed = JSON.parse(fullResponse);
                const finalContent = parsed.response || fullResponse;

                // Update message with final content and stop streaming
                set((state) => ({
                  messages: state.messages.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: finalContent, isStreaming: false }
                      : msg
                  ),
                }));
              } catch (error) {
                // Use raw response if JSON parsing fails
                set((state) => ({
                  messages: state.messages.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: fullResponse, isStreaming: false }
                      : msg
                  ),
                }));
              }

              // Refresh quests after chat completion
              set({ isRefreshingQuests: true });
              try {
                const questStoreState = useTaskGoalStore.getState();
                if (
                  'fetchTodayTasks' in questStoreState &&
                  typeof questStoreState.fetchTodayTasks === 'function'
                ) {
                  (questStoreState.fetchTodayTasks as any)();
                }
              } catch (error) {
                console.warn('Failed to refresh quests after chat:', error);
              } finally {
                set({ isRefreshingQuests: false });
              }

              set({
                isLoading: false,
                isStreaming: false,
                currentStreamingMessageId: null,
              });
            },
            // onError callback
            (error: Error) => {
              set({
                isLoading: false,
                isStreaming: false,
                currentStreamingMessageId: null,
                error: error.message,
              });
              // Remove the empty AI message on error
              set((state) => ({
                messages: state.messages.filter(
                  (msg) => msg.id !== aiMessageId
                ),
              }));
            }
          );
        } catch (error) {
          console.error('Chat error:', error);
        }
      },
      addMessage: (message) => {
        const id = `msg_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        const newMessage: ChatMessage = {
          id,
          timestamp,
          ...message,
        };

        set((state) => ({
          messages: [...state.messages, newMessage],
        }));

        return id;
      },
      updateStreamingMessage: (messageId, newContent) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: msg.content + newContent }
              : msg
          ),
        }));
      },
      finishStreaming: (messageId) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, isStreaming: false } : msg
          ),
        }));
      },
      clearError: () => set({ error: null }),
      clearMessages: () => {
        set({
          messages: [
            {
              id: 'initial',
              content:
                "Hi! I'm Zik, your personal growth companion. How are you feeling today?",
              sender: 'zik',
              timestamp: new Date().toISOString(),
            },
          ],
          isLoading: false,
          isStreaming: false,
          isRefreshingQuests: false,
          error: null,
          currentStreamingMessageId: null,
        });
      },
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist messages, not loading states or errors
      partialize: (state) => ({
        messages: state.messages,
      }),
    }
  )
);

// Selectors
export const useChatMessages = () => useChatStore((state) => state.messages);
export const useChatLoading = () => useChatStore((state) => state.isLoading);
export const useChatStreaming = () =>
  useChatStore((state) => state.isStreaming);
export const useChatRefreshingQuests = () =>
  useChatStore((state) => state.isRefreshingQuests);
export const useChatError = () => useChatStore((state) => state.error);
