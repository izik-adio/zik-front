import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DailyQuest,
  EpicQuest,
  Milestone,
  CreateDailyQuestData,
  CreateEpicQuestData,
  UpdateDailyQuestData,
  UpdateEpicQuestData,
  dailyQuestsApi,
  epicQuestsApi,
  roadmapApi
} from '../api/quests';

/**
 * Roadmap cache entry structure
 */
interface RoadmapCacheEntry {
  milestones: Milestone[];
  lastFetched: number;
  epicQuest: EpicQuest | null;
}

/**
 * Active roadmap state structure
 */
interface ActiveRoadmapState {
  epicQuestId: string | null;
  epicQuest: EpicQuest | null;
  milestones: Milestone[];
}

/**
 * Progressive task access structure
 */
interface TaskAccessState {
  todayTasks: DailyQuest[];
  futureTasks: DailyQuest[];
  canAccessFuture: boolean;
  maxDaysAhead: number;
}

/**
 * Quest Store State Interface
 */
interface QuestStoreState {
  // Core Data
  epicQuests: EpicQuest[];
  dailyQuests: DailyQuest[];

  // Roadmap Management
  roadmapCache: Record<string, RoadmapCacheEntry>;
  activeRoadmap: ActiveRoadmapState;

  // Progressive Task Access
  taskAccess: TaskAccessState;

  // Loading and Error States
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetch: string | null;

  // Cache Control
  cacheExpiryTime: number; // 5 minutes in milliseconds

  // Epic Quest Actions
  fetchEpicQuests: (forceRefresh?: boolean) => Promise<void>;
  createEpicQuest: (questData: Omit<CreateEpicQuestData, 'type'>) => Promise<EpicQuest>;
  updateEpicQuest: (questId: string, updateData: UpdateEpicQuestData) => Promise<EpicQuest>;
  deleteEpicQuest: (questId: string) => Promise<void>;
  getEpicQuestById: (questId: string) => Promise<EpicQuest>;

  // Daily Quest Actions
  fetchDailyQuests: (date: string, forceRefresh?: boolean) => Promise<void>;
  createDailyQuest: (questData: Omit<CreateDailyQuestData, 'type'>) => Promise<DailyQuest>;
  updateDailyQuest: (questId: string, updateData: UpdateDailyQuestData) => Promise<DailyQuest>;
  deleteDailyQuest: (questId: string) => Promise<void>;

  // Roadmap Actions
  fetchRoadmap: (epicQuestId: string, forceRefresh?: boolean) => Promise<Milestone[]>;
  generateRoadmap: (epicQuestId: string) => Promise<void>;
  clearRoadmapCache: (epicQuestId?: string) => void;
  pollRoadmapGeneration: (epicQuestId: string, maxAttempts?: number) => Promise<void>;

  // Active Roadmap Management
  setActiveRoadmap: (epicQuestId: string) => Promise<void>;

  // Progressive Task Access
  fetchFutureTasks: () => Promise<void>;
  checkTaskAccessRules: () => void;
  getAvailableTasks: () => { today: DailyQuest[]; future: DailyQuest[]; showFuture: boolean };

  // Utility Actions
  refreshTodayData: () => Promise<void>;
  refreshQuestsData: () => Promise<void>;
  clearError: () => void;
  resetState: () => void;
}

/**
 * Initial state values
 */
const initialState = {
  epicQuests: [],
  dailyQuests: [],
  roadmapCache: {},
  activeRoadmap: {
    epicQuestId: null,
    epicQuest: null,
    milestones: [],
  },
  taskAccess: {
    todayTasks: [],
    futureTasks: [],
    canAccessFuture: false,
    maxDaysAhead: 2,
  },
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetch: null,
  cacheExpiryTime: 5 * 60 * 1000, // 5 minutes
};

/**
 * Main Quest Store using Zustand
 */
export const useQuestStore = create<QuestStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Epic Quest Actions
      fetchEpicQuests: async (forceRefresh = false) => {
        const state = get();
        const now = Date.now();
        const lastFetchTime = state.lastFetch ? new Date(state.lastFetch).getTime() : 0;

        // Skip fetch if data is fresh and not forcing refresh
        if (!forceRefresh && state.epicQuests.length > 0 && (now - lastFetchTime) < state.cacheExpiryTime) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const epicQuests = await epicQuestsApi.fetchEpicQuests();
          set({
            epicQuests,
            isLoading: false,
            lastFetch: new Date().toISOString()
          });

          // Auto-select an active epic quest if none is currently set
          const currentState = get();
          if (!currentState.activeRoadmap.epicQuestId && epicQuests.length > 0) {
            // Only set active roadmap if there's an epic quest with a ready roadmap
            const questWithRoadmap = epicQuests.find(quest => quest.roadmapStatus === 'ready');
            if (questWithRoadmap) {
              try {
                await currentState.setActiveRoadmap(questWithRoadmap.questId);
              } catch (error) {
                console.warn('Failed to set active roadmap for quest:', questWithRoadmap.questId, error);
              }
            } else {
              console.log('No epic quests with ready roadmaps found, skipping auto-selection');
            }
          }
        } catch (error: any) {
          console.error('Failed to fetch epic quests:', error);
          set({
            error: error.message || 'Failed to fetch epic quests',
            isLoading: false
          });
        }
      },

      createEpicQuest: async (questData) => {
        set({ isLoading: true, error: null });
        try {
          const newQuest = await epicQuestsApi.createEpicQuest(questData);
          set(state => ({
            epicQuests: [...state.epicQuests, newQuest],
            isLoading: false
          }));
          return newQuest;
        } catch (error: any) {
          console.error('Failed to create epic quest:', error);
          set({
            error: error.message || 'Failed to create epic quest',
            isLoading: false
          });
          throw error;
        }
      },

      updateEpicQuest: async (questId, updateData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedQuest = await epicQuestsApi.updateEpicQuest(questId, updateData);
          set(state => ({
            epicQuests: state.epicQuests.map(quest =>
              quest.questId === questId ? updatedQuest : quest
            ),
            activeRoadmap: state.activeRoadmap.epicQuestId === questId
              ? { ...state.activeRoadmap, epicQuest: updatedQuest }
              : state.activeRoadmap,
            isLoading: false
          }));
          return updatedQuest;
        } catch (error: any) {
          console.error('Failed to update epic quest:', error);
          set({
            error: error.message || 'Failed to update epic quest',
            isLoading: false
          });
          throw error;
        }
      },

      deleteEpicQuest: async (questId) => {
        set({ isLoading: true, error: null });
        try {
          await epicQuestsApi.deleteEpicQuest(questId);
          set(state => ({
            epicQuests: state.epicQuests.filter(quest => quest.questId !== questId),
            activeRoadmap: state.activeRoadmap.epicQuestId === questId
              ? initialState.activeRoadmap
              : state.activeRoadmap,
            roadmapCache: Object.fromEntries(
              Object.entries(state.roadmapCache).filter(([key]) => key !== questId)
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Failed to delete epic quest:', error);
          set({
            error: error.message || 'Failed to delete epic quest',
            isLoading: false
          });
          throw error;
        }
      },

      getEpicQuestById: async (questId) => {
        try {
          return await epicQuestsApi.getEpicQuestById(questId);
        } catch (error: any) {
          console.error('Failed to fetch epic quest by ID:', error);
          throw error;
        }
      },

      // Daily Quest Actions
      fetchDailyQuests: async (date, forceRefresh = false) => {
        const state = get();
        const now = Date.now();
        const lastFetchTime = state.lastFetch ? new Date(state.lastFetch).getTime() : 0;

        // Skip fetch if data is fresh and not forcing refresh
        if (!forceRefresh && state.dailyQuests.length > 0 && (now - lastFetchTime) < state.cacheExpiryTime) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const dailyQuests = await dailyQuestsApi.fetchDailyQuestsByDate(date);

          // Only update if data has actually changed to prevent unnecessary re-renders
          const currentTaskIds = state.taskAccess.todayTasks.map(t => t.questId).sort();
          const newTaskIds = dailyQuests.map(t => t.questId).sort();
          const hasChanged = JSON.stringify(currentTaskIds) !== JSON.stringify(newTaskIds) ||
            forceRefresh ||
            dailyQuests.some(task => {
              const existing = state.taskAccess.todayTasks.find(t => t.questId === task.questId);
              return !existing || existing.status !== task.status || existing.title !== task.title;
            });

          if (hasChanged) {
            set(state => ({
              dailyQuests,
              taskAccess: {
                ...state.taskAccess,
                todayTasks: dailyQuests,
              },
              isLoading: false,
              lastFetch: new Date().toISOString()
            }));
          } else {
            set({ isLoading: false });
          }
        } catch (error: any) {
          console.error('Failed to fetch daily quests:', error);
          set({
            error: error.message || 'Failed to fetch daily quests',
            isLoading: false
          });
        }
      },

      createDailyQuest: async (questData) => {
        set({ isLoading: true, error: null });
        try {
          const newQuest = await dailyQuestsApi.createDailyQuest(questData);
          set(state => ({
            dailyQuests: [...state.dailyQuests, newQuest],
            taskAccess: {
              ...state.taskAccess,
              todayTasks: [...state.taskAccess.todayTasks, newQuest],
            },
            isLoading: false
          }));
          return newQuest;
        } catch (error: any) {
          console.error('Failed to create daily quest:', error);
          set({
            error: error.message || 'Failed to create daily quest',
            isLoading: false
          });
          throw error;
        }
      },

      updateDailyQuest: async (questId, updateData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedQuest = await dailyQuestsApi.updateDailyQuest(questId, updateData);
          set(state => ({
            dailyQuests: state.dailyQuests.map(quest =>
              quest.questId === questId ? updatedQuest : quest
            ),
            taskAccess: {
              ...state.taskAccess,
              todayTasks: state.taskAccess.todayTasks.map(quest =>
                quest.questId === questId ? updatedQuest : quest
              ),
              futureTasks: state.taskAccess.futureTasks.map(quest =>
                quest.questId === questId ? updatedQuest : quest
              ),
            },
            isLoading: false
          }));
          return updatedQuest;
        } catch (error: any) {
          console.error('Failed to update daily quest:', error);
          set({
            error: error.message || 'Failed to update daily quest',
            isLoading: false
          });
          throw error;
        }
      },

      deleteDailyQuest: async (questId) => {
        set({ isLoading: true, error: null });
        try {
          await dailyQuestsApi.deleteDailyQuest(questId);
          set(state => ({
            dailyQuests: state.dailyQuests.filter(quest => quest.questId !== questId),
            taskAccess: {
              ...state.taskAccess,
              todayTasks: state.taskAccess.todayTasks.filter(quest => quest.questId !== questId),
              futureTasks: state.taskAccess.futureTasks.filter(quest => quest.questId !== questId),
            },
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Failed to delete daily quest:', error);
          set({
            error: error.message || 'Failed to delete daily quest',
            isLoading: false
          });
          throw error;
        }
      },

      // Roadmap Actions
      fetchRoadmap: async (epicQuestId, forceRefresh = false) => {
        const state = get();
        const cached = state.roadmapCache[epicQuestId];
        const now = Date.now();

        // Return cached data if fresh and not forcing refresh
        if (!forceRefresh && cached && (now - cached.lastFetched) < state.cacheExpiryTime) {
          return cached.milestones;
        }

        set({ isLoading: true, error: null });
        try {
          const milestones = await roadmapApi.fetchRoadmap(epicQuestId);
          const epicQuest = state.epicQuests.find(quest => quest.questId === epicQuestId) || null;

          set(state => ({
            roadmapCache: {
              ...state.roadmapCache,
              [epicQuestId]: {
                milestones,
                lastFetched: now,
                epicQuest,
              }
            },
            isLoading: false
          }));

          return milestones;
        } catch (error: any) {
          console.error('Failed to fetch roadmap:', error);
          set({
            error: error.message || 'Failed to fetch roadmap',
            isLoading: false
          });
          throw error;
        }
      },

      generateRoadmap: async (epicQuestId) => {
        set({ isLoading: true, error: null });
        try {
          await roadmapApi.generateRoadmap(epicQuestId);

          // Update epic quest status to 'generating'
          set(state => ({
            epicQuests: state.epicQuests.map(quest =>
              quest.questId === epicQuestId
                ? { ...quest, roadmapStatus: 'generating' }
                : quest
            ),
            isLoading: false
          }));

          // Start polling for completion
          await get().pollRoadmapGeneration(epicQuestId);
        } catch (error: any) {
          console.error('Failed to generate roadmap:', error);
          set({
            error: error.message || 'Failed to generate roadmap',
            isLoading: false
          });
          throw error;
        }
      },

      clearRoadmapCache: (epicQuestId) => {
        if (epicQuestId) {
          set(state => ({
            roadmapCache: Object.fromEntries(
              Object.entries(state.roadmapCache).filter(([key]) => key !== epicQuestId)
            )
          }));
        } else {
          set({ roadmapCache: {} });
        }
      },

      pollRoadmapGeneration: async (epicQuestId, maxAttempts = 30) => {
        let attempts = 0;
        const pollInterval = 2000; // 2 seconds

        const poll = async (): Promise<void> => {
          if (attempts >= maxAttempts) {
            set(state => ({
              epicQuests: state.epicQuests.map(quest =>
                quest.questId === epicQuestId
                  ? { ...quest, roadmapStatus: 'error' }
                  : quest
              ),
              error: 'Roadmap generation timed out'
            }));
            return;
          }

          try {
            const epicQuest = await epicQuestsApi.getEpicQuestById(epicQuestId);

            if (epicQuest.roadmapStatus === 'ready') {
              set(state => ({
                epicQuests: state.epicQuests.map(quest =>
                  quest.questId === epicQuestId ? epicQuest : quest
                )
              }));

              // Fetch the roadmap data
              await get().fetchRoadmap(epicQuestId, true);
              return;
            } else if (epicQuest.roadmapStatus === 'error') {
              set(state => ({
                epicQuests: state.epicQuests.map(quest =>
                  quest.questId === epicQuestId ? epicQuest : quest
                ),
                error: 'Roadmap generation failed'
              }));
              return;
            }

            // Continue polling
            attempts++;
            setTimeout(poll, pollInterval);
          } catch (error: any) {
            console.error('Error polling roadmap generation:', error);
            set({ error: error.message || 'Error checking roadmap status' });
          }
        };

        await poll();
      },

      // Active Roadmap Management
      setActiveRoadmap: async (epicQuestId) => {
        const state = get();
        const epicQuest = state.epicQuests.find(quest => quest.questId === epicQuestId);

        if (!epicQuest) {
          throw new Error('Epic quest not found');
        }

        // Check if the epic quest has a ready roadmap
        if (epicQuest.roadmapStatus !== 'ready') {
          console.warn(`Epic quest ${epicQuestId} does not have a ready roadmap (status: ${epicQuest.roadmapStatus})`);
          // Set a basic active roadmap without milestones
          set({
            activeRoadmap: {
              epicQuestId,
              epicQuest,
              milestones: [],
            }
          });
          return;
        }

        try {
          const milestones = await state.fetchRoadmap(epicQuestId);

          set({
            activeRoadmap: {
              epicQuestId,
              epicQuest,
              milestones,
            }
          });

          // Note: Removed fetchActiveMilestoneData call as it was causing task clearing issues
          // Tasks are now fetched consistently through fetchDailyQuests
        } catch (error: any) {
          console.error('Failed to set active roadmap:', error);
          // Set a basic active roadmap even if roadmap fetch fails
          set({
            activeRoadmap: {
              epicQuestId,
              epicQuest,
              milestones: [],
            }
          });
        }
      },

      // Progressive Task Access
      fetchFutureTasks: async () => {
        // Implementation for fetching future tasks based on access rules
        // This would be expanded based on specific business logic
        set(state => ({
          taskAccess: {
            ...state.taskAccess,
            futureTasks: [], // Placeholder
          }
        }));
      },

      checkTaskAccessRules: () => {
        const state = get();
        // Implement logic to determine if user can access future tasks
        // Based on completion rate, milestone progress, etc.
        const completionRate = state.taskAccess.todayTasks.length > 0
          ? state.taskAccess.todayTasks.filter(task => task.status === 'completed').length / state.taskAccess.todayTasks.length
          : 0;

        const canAccessFuture = completionRate >= 0.8; // 80% completion rate threshold

        set(prevState => ({
          taskAccess: {
            ...prevState.taskAccess,
            canAccessFuture,
          }
        }));
      },

      getAvailableTasks: () => {
        const state = get();
        return {
          today: state.taskAccess.todayTasks,
          future: state.taskAccess.canAccessFuture ? state.taskAccess.futureTasks : [],
          showFuture: state.taskAccess.canAccessFuture,
        };
      },

      // Utility Actions
      refreshTodayData: async () => {
        const state = get();

        // Prevent concurrent refreshes
        if (state.isRefreshing) {
          return;
        }

        set({ isRefreshing: true });
        try {
          const today = new Date().toISOString().split('T')[0];

          // Fetch all today's tasks
          await get().fetchDailyQuests(today, true);

          // Update task access rules based on completion
          get().checkTaskAccessRules();
        } catch (error) {
          console.error('Failed to refresh today data:', error);
        } finally {
          set({ isRefreshing: false });
        }
      },

      refreshQuestsData: async () => {
        set({ isRefreshing: true });
        try {
          await get().fetchEpicQuests(true);
          await get().refreshTodayData();
        } catch (error: any) {
          console.error('Failed to refresh quest data:', error);
        } finally {
          set({ isRefreshing: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      resetState: () => {
        set(initialState);
      },
    }),
    {
      name: 'quest-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist essential data
        epicQuests: state.epicQuests,
        roadmapCache: state.roadmapCache,
        activeRoadmap: state.activeRoadmap,
        lastFetch: state.lastFetch,
      }),
    }
  )
);

// Selector hooks for easy component consumption
export const useEpicQuests = () => useQuestStore(state => state.epicQuests);
export const useDailyQuests = () => useQuestStore(state => state.dailyQuests);
export const useActiveRoadmap = () => useQuestStore(state => state.activeRoadmap);
export const useActiveMilestoneTasks = () => useQuestStore(state => state.taskAccess.todayTasks);
export const useTodayTasks = () => useQuestStore(state => state.taskAccess.todayTasks);
export const useIsLoading = () => useQuestStore(state => state.isLoading);
export const useIsRefreshing = () => useQuestStore(state => state.isRefreshing);
export const useQuestError = () => useQuestStore(state => state.error);

// Individual action hooks to prevent infinite re-renders
export const useFetchEpicQuests = () => useQuestStore(state => state.fetchEpicQuests);
export const useCreateEpicQuest = () => useQuestStore(state => state.createEpicQuest);
export const useDeleteEpicQuest = () => useQuestStore(state => state.deleteEpicQuest);
export const useGenerateRoadmap = () => useQuestStore(state => state.generateRoadmap);
export const useFetchRoadmap = () => useQuestStore(state => state.fetchRoadmap);
export const useRefreshTodayData = () => useQuestStore(state => state.refreshTodayData);
export const useRefreshQuestsData = () => useQuestStore(state => state.refreshQuestsData);

// Daily Quest action hooks
export const useFetchDailyQuests = () => useQuestStore(state => state.fetchDailyQuests);
export const useCreateDailyQuest = () => useQuestStore(state => state.createDailyQuest);
export const useUpdateDailyQuest = () => useQuestStore(state => state.updateDailyQuest);
export const useDeleteDailyQuest = () => useQuestStore(state => state.deleteDailyQuest);

// Legacy exports for backward compatibility
export const useTaskGoalStore = useQuestStore;
export const useGoals = () => useQuestStore(state => state.epicQuests);
export const useTasks = () => useQuestStore(state => state.dailyQuests);

// Legacy action selector for backward compatibility
export const getTaskGoalStoreActions = () => useQuestStore.getState();
