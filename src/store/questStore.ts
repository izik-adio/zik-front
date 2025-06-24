import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EpicQuest, DailyQuest, GetQuestsResponse } from '../types/api';
import { apiService } from '../services/api';

interface QuestState {
  // Data
  epicQuests: EpicQuest[];
  dailyQuests: DailyQuest[];
  isLoading: boolean;
  error: string | null;
  lastFetch: string | null;

  // Actions  fetchQuests: (date?: string) => Promise<void>;
  fetchTodayQuests: () => Promise<void>;
  fetchQuestsFromCache: () => void;
  markQuestComplete: (questId: string, type: 'goal' | 'task') => Promise<void>;
  createQuest: (questData: {
    title: string;
    type: 'goal' | 'task';
    dueDate?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    epicId?: string;
  }) => Promise<void>;
  updateQuest: (
    questId: string,
    questData: {
      status?:
        | 'active'
        | 'completed'
        | 'paused'
        | 'pending'
        | 'in-progress'
        | 'skipped';
      title?: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high';
      category?: string;
      targetDate?: string;
      dueDate?: string;
    },
    type: 'goal' | 'task'
  ) => Promise<void>;
  deleteQuest: (questId: string, type: 'goal' | 'task') => Promise<void>;
  clearError: () => void;
  resetState: () => void;
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      // Initial state
      epicQuests: [],
      dailyQuests: [],
      isLoading: false,
      error: null,
      lastFetch: null,

      // Actions
      fetchQuests: async (date?: string) => {
        // Always use today's date if no date is provided
        const targetDate = date || new Date().toISOString().split('T')[0];

        set({ isLoading: true, error: null });
        try {
          const response: GetQuestsResponse = await apiService.getQuests(
            targetDate
          );

          set({
            epicQuests: response.epicQuests,
            dailyQuests: response.dailyQuests,
            isLoading: false,
            lastFetch: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error in fetchQuests:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch quests';

          set({
            isLoading: false,
            error: errorMessage,
          });
        }
      },
      fetchTodayQuests: async () => {
        const today = new Date().toISOString().split('T')[0];
        set({ isLoading: true, error: null });
        try {
          const response: GetQuestsResponse = await apiService.getQuests(today);
          set({
            epicQuests: response.epicQuests,
            dailyQuests: response.dailyQuests,
            isLoading: false,
            lastFetch: new Date().toISOString(),
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : 'Failed to fetch quests',
          });
        }
      },
      fetchQuestsFromCache: () => {
        // This method allows components to trigger a re-render with cached data
        // Only update if we actually have cached data
        const state = get();
        // Data is already available from persistence, no action needed
      },
      markQuestComplete: async (questId: string, type: 'goal' | 'task') => {
        try {
          const updatedQuest = await apiService.markQuestComplete(
            questId,
            type
          );

          if (type === 'goal') {
            set((state) => ({
              epicQuests: state.epicQuests.map((quest) =>
                quest.questId === questId
                  ? { ...quest, ...updatedQuest, status: 'completed' }
                  : quest
              ),
            }));
          } else {
            set((state) => ({
              dailyQuests: state.dailyQuests.map((quest) =>
                quest.questId === questId
                  ? { ...quest, ...updatedQuest, status: 'completed' }
                  : quest
              ),
            }));
          }
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to update quest',
          });
          throw error; // Re-throw so UI can handle if needed
        }
      },

      createQuest: async (questData) => {
        set({ isLoading: true, error: null });
        try {
          const newQuest = await apiService.createQuest(questData);

          if (questData.type === 'goal') {
            set((state) => ({
              epicQuests: [...state.epicQuests, newQuest as EpicQuest],
              isLoading: false,
            }));
          } else {
            set((state) => ({
              dailyQuests: [...state.dailyQuests, newQuest as DailyQuest],
              isLoading: false,
            }));
          }
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : 'Failed to create quest',
          });
          throw error;
        }
      },

      updateQuest: async (questId, questData, type) => {
        try {
          const updatedQuest = await apiService.updateQuest(
            questId,
            questData,
            type
          );

          if (type === 'goal') {
            set((state) => ({
              epicQuests: state.epicQuests.map((quest) =>
                quest.questId === questId ? (updatedQuest as EpicQuest) : quest
              ),
            }));
          } else {
            set((state) => ({
              dailyQuests: state.dailyQuests.map((quest) =>
                quest.questId === questId ? (updatedQuest as DailyQuest) : quest
              ),
            }));
          }
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to update quest',
          });
          throw error;
        }
      },

      deleteQuest: async (questId, type) => {
        try {
          await apiService.deleteQuest(questId, type);

          if (type === 'goal') {
            set((state) => ({
              epicQuests: state.epicQuests.filter(
                (quest) => quest.questId !== questId
              ),
            }));
          } else {
            set((state) => ({
              dailyQuests: state.dailyQuests.filter(
                (quest) => quest.questId !== questId
              ),
            }));
          }
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to delete quest',
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
      resetState: () =>
        set({
          epicQuests: [],
          dailyQuests: [],
          isLoading: false,
          error: null,
          lastFetch: null,
        }),
    }),
    {
      name: 'quest-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist quest data but not loading states or errors
      partialize: (state) => ({
        epicQuests: state.epicQuests,
        dailyQuests: state.dailyQuests,
        lastFetch: state.lastFetch,
      }),
    }
  )
);

// Selectors for better performance
export const useEpicQuests = () => useQuestStore((state) => state.epicQuests);
export const useDailyQuests = () => useQuestStore((state) => state.dailyQuests);
export const useQuestLoading = () => useQuestStore((state) => state.isLoading);
export const useQuestError = () => useQuestStore((state) => state.error);

// Direct store access for actions (workaround for persist typing issues)
export const getQuestStoreActions = () => {
  const state = useQuestStore.getState() as any;
  return {
    fetchQuests: state.fetchQuests,
    fetchTodayQuests: state.fetchTodayQuests,
    fetchQuestsFromCache: state.fetchQuestsFromCache,
    markQuestComplete: state.markQuestComplete,
    createQuest: state.createQuest,
    updateQuest: state.updateQuest,
    deleteQuest: state.deleteQuest,
    clearError: state.clearError,
    resetState: state.resetState,
  };
};
