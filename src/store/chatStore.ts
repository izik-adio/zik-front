import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { useQuestStore } from './questStore';
import { chatHistoryService } from '../services/chatHistory';

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
  questsWereModified: boolean;
  error: string | null;
  currentStreamingMessageId: string | null;
  prefilledInput: string | null;
  isOnline: boolean;
  lastSyncTime: number | null;
  isLoadingHistory: boolean;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateStreamingMessage: (messageId: string, content: string) => void;
  finishStreaming: (messageId: string) => void;
  clearError: () => void;
  clearMessages: () => Promise<void>;
  setPrefilledInput: (text: string) => void;
  clearPrefilledInput: () => void;
  resetQuestModificationFlag: () => void;

  // Chat history actions
  loadChatHistory: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      isLoading: false,
      isStreaming: false,
      isRefreshingQuests: false,
      questsWereModified: false,
      error: null,
      currentStreamingMessageId: null,
      prefilledInput: null,
      isOnline: true,
      lastSyncTime: null,
      isLoadingHistory: false,

      sendMessage: async (message: string) => {
        const { addMessage, isOnline } = get();

        // Check if user is online before sending message
        if (!isOnline) {
          set({
            error:
              'No network connection. Please check your internet and try again.',
          });
          return;
        }

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
            // onChunk callback
            (chunk: string) => {
              try {
                const parsed = JSON.parse(chunk);
                if (parsed.response) {
                  // Check if the response suggests quest creation/modification during streaming
                  const responseText = parsed.response.toLowerCase();
                  const containsQuestCreation =
                    responseText.includes('created') ||
                    responseText.includes('added') ||
                    responseText.includes('new task') ||
                    responseText.includes('new quest') ||
                    responseText.includes('new goal');

                  // If we detect quest creation, trigger an early refresh
                  if (containsQuestCreation && !get().isRefreshingQuests) {
                    set({ questsWereModified: true });
                  }

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
                // Check for quest creation keywords in raw chunk too
                const chunkText = chunk.toLowerCase();
                const containsQuestCreation =
                  chunkText.includes('created') ||
                  chunkText.includes('added') ||
                  chunkText.includes('new task') ||
                  chunkText.includes('new quest') ||
                  chunkText.includes('new goal');

                if (containsQuestCreation && !get().isRefreshingQuests) {
                  set({ questsWereModified: true });
                }

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
                const parsed = JSON.parse(fullResponse);
                const finalContent = parsed.response || fullResponse;

                set((state) => ({
                  messages: state.messages.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: finalContent, isStreaming: false }
                      : msg
                  ),
                }));
              } catch (error) {
                set((state) => ({
                  messages: state.messages.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: fullResponse, isStreaming: false }
                      : msg
                  ),
                }));
              }

              // Refresh quests after chat completion only if the response suggests quest modifications
              const responseContainsQuestUpdates =
                fullResponse.toLowerCase().includes('quest') ||
                fullResponse.toLowerCase().includes('task') ||
                fullResponse.toLowerCase().includes('goal') ||
                fullResponse.toLowerCase().includes('created') ||
                fullResponse.toLowerCase().includes('updated') ||
                fullResponse.toLowerCase().includes('completed') ||
                fullResponse.toLowerCase().includes('milestone') ||
                fullResponse.toLowerCase().includes('added') ||
                fullResponse.toLowerCase().includes('new');

              if (responseContainsQuestUpdates) {
                set({ isRefreshingQuests: true, questsWereModified: true });
                try {
                  // Refresh both tasks and goals comprehensively
                  const questStore = useQuestStore.getState();
                  await questStore.refreshAllPages(); // This refreshes both epic quests and today's data comprehensively
                } catch (error) {
                  console.warn('Failed to refresh quests after chat:', error);
                } finally {
                  set({ isRefreshingQuests: false });
                }
              } else {
                set({ questsWereModified: false });
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

      clearMessages: async () => {
        try {
          // Clear on server first
          await chatHistoryService.clearChatHistory();

          // Then clear locally
          set({
            messages: [
              {
                id: `welcome_${Date.now()}`,
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
        } catch (error) {
          console.error('Error clearing chat history:', error);
          set({ error: 'Failed to clear chat history' });
        }
      },

      setPrefilledInput: (text: string) => {
        set({ prefilledInput: text });
      },

      clearPrefilledInput: () => {
        set({ prefilledInput: null });
      },

      loadChatHistory: async () => {
        set({ isLoadingHistory: true, error: null });

        try {
          const response = await chatHistoryService.loadChatHistory();

          if (response.length > 0) {
            // Convert history messages to chat messages
            // The API returns 'role' field with 'user' or 'assistant', we need to map it to 'sender'
            const messages: ChatMessage[] = response.map((historyMsg: any) => ({
              id: historyMsg.messageId,
              content: historyMsg.content,
              sender: historyMsg.role === 'user' ? 'user' : 'zik', // Map role to sender
              timestamp: historyMsg.timestamp,
            }));

            set({
              messages,
              isLoadingHistory: false,
              lastSyncTime: Date.now(),
            });
          } else {
            // No history, start with welcome message
            set({
              messages: [
                {
                  id: `welcome_${Date.now()}`,
                  content:
                    "Hi! I'm Zik, your personal growth companion. How are you feeling today?",
                  sender: 'zik',
                  timestamp: new Date().toISOString(),
                },
              ],
              isLoadingHistory: false,
            });
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          set({
            isLoadingHistory: false,
            error: 'Failed to load chat history',
            // Start with welcome message on error
            messages: [
              {
                id: `welcome_${Date.now()}`,
                content:
                  "Hi! I'm Zik, your personal growth companion. How are you feeling today?",
                sender: 'zik',
                timestamp: new Date().toISOString(),
              },
            ],
          });
        }
      },

      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
      },

      resetQuestModificationFlag: () => {
        set({ questsWereModified: false });
      },
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist messages and sync time
      partialize: (state) => ({
        messages: state.messages,
        lastSyncTime: state.lastSyncTime,
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
export const useChatPrefilledInput = () =>
  useChatStore((state) => state.prefilledInput);
export const useOnlineStatus = () => useChatStore((state) => state.isOnline);
export const useLastSyncTime = () =>
  useChatStore((state) => state.lastSyncTime);
export const useIsLoadingHistory = () =>
  useChatStore((state) => state.isLoadingHistory);
