import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Goal, Milestone } from '../api/quests';
import { tasksApi, goalsApi, roadmapApi } from '../api/quests';

interface TaskGoalState {
  // Epic Quests (Goals)
  epics: Goal[];

  // Cached roadmaps for epics
  roadmapCache: Record<string, {
    milestones: Milestone[];
    lastFetched: number;
    epic: Goal | null;
  }>;

  // Active Roadmap Data
  activeRoadmap: {
    epicId: string | null;
    epic: Goal | null;
    milestones: Milestone[];
    activeMilestone: Milestone | null;
  };

  // Daily Tasks for Active Milestone
  activeMilestoneTasks: Task[];

  // Legacy support for existing components
  goals: Goal[];
  tasks: Task[];

  // Loading and Error States
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetch: string | null;

  // Cache control
  cacheExpiryTime: number; // Cache expiry in milliseconds (default: 5 minutes)

  // Epic Quest Actions
  fetchEpics: (forceRefresh?: boolean) => Promise<void>;
  createEpic: (epicData: any) => Promise<void>;
  deleteEpic: (epicId: string) => Promise<void>;

  // Roadmap Actions
  fetchRoadmap: (epicId: string, forceRefresh?: boolean) => Promise<Milestone[]>;
  generateRoadmap: (epicId: string) => Promise<void>;
  clearRoadmapCache: (epicId?: string) => void;

  // Milestone Actions
  completeMilestone: (milestoneId: string) => Promise<void>;
  activateNextMilestone: (epicId: string) => Promise<void>;

  // Active Milestone Data Actions
  fetchActiveMilestoneData: () => Promise<void>;

  // Refresh Actions
  refreshTodayData: () => Promise<void>;
  refreshQuestsData: () => Promise<void>;

  // Legacy Actions (for compatibility)
  fetchTodayTasks: (forceRefresh?: boolean) => Promise<void>;
  fetchGoals: (forceRefresh?: boolean) => Promise<void>;
  fetchTasksFromCache: () => void;
  markTaskComplete: (taskId: string) => Promise<void>;
  markGoalComplete: (goalId: string) => Promise<void>;
  createTask: (taskData: any) => Promise<void>;
  createGoal: (goalData: any) => Promise<void>;
  updateTask: (taskId: string, data: any) => Promise<void>;
  updateGoal: (goalId: string, data: any) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  clearError: () => void;
  resetState: () => void;
}

export const useTaskGoalStore = create<TaskGoalState>()(
  persist(
    (set, get) => ({
      // Epic Quests (Goals)
      epics: [],

      // Cached roadmaps for epics
      roadmapCache: {},

      // Active Roadmap Data
      activeRoadmap: {
        epicId: null,
        epic: null,
        milestones: [],
        activeMilestone: null,
      },

      // Daily Tasks for Active Milestone
      activeMilestoneTasks: [],

      // Legacy support
      goals: [],
      tasks: [],

      // Loading and Error States
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastFetch: null,

      // Cache control (5 minutes default)
      cacheExpiryTime: 5 * 60 * 1000,

      // Epic Quest Actions
      fetchEpics: async (forceRefresh = false) => {
        const now = Date.now();
        const lastFetchTime = get().lastFetch ? new Date(get().lastFetch!).getTime() : 0;
        const cacheExpiry = get().cacheExpiryTime;

        // Skip fetch if data is fresh and not forcing refresh
        if (!forceRefresh && get().epics.length > 0 && (now - lastFetchTime) < cacheExpiry) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response: any = await goalsApi.fetchGoals();
          const epics = Array.isArray(response) ? response : (response && Array.isArray(response.goals) ? response.goals : []);
          set({ epics, goals: epics, isLoading: false, lastFetch: new Date().toISOString() });

          // Auto-select an active goal if none is currently set and we have goals
          const currentState = get();
          if (!currentState.activeRoadmap.epicId && epics.length > 0) {
            // Find the first goal with a roadmap, or just the first goal
            const goalWithRoadmap = epics.find((epic: Goal) => epic.roadmapStatus === 'ready');
            const selectedGoal = goalWithRoadmap || epics[0];

            if (selectedGoal) {
              // Fetch the roadmap for this goal to set it as active
              await get().fetchRoadmap(selectedGoal.goalId);
            }
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch epic quests',
          });
        }
      },

      createEpic: async (epicData) => {
        set({ isLoading: true, error: null });
        try {
          const newEpic = await goalsApi.createGoal(epicData);
          set((state) => ({
            epics: [...state.epics, newEpic],
            goals: [...state.goals, newEpic],
            isLoading: false,
          }));
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to create epic quest',
          });
        }
      },

      deleteEpic: async (epicId) => {
        try {
          await goalsApi.deleteGoal(epicId);
          set((state) => ({
            epics: state.epics.filter((e) => e.goalId !== epicId),
            goals: state.goals.filter((g) => g.goalId !== epicId),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete epic quest',
          });
        }
      },

      // Roadmap Actions
      fetchRoadmap: async (epicId, forceRefresh = false) => {
        const now = Date.now();
        const cached = get().roadmapCache[epicId];
        const cacheExpiry = get().cacheExpiryTime;

        // Use cached data if available and fresh
        if (!forceRefresh && cached && (now - cached.lastFetched) < cacheExpiry) {
          set({
            activeRoadmap: {
              epicId,
              epic: cached.epic,
              milestones: cached.milestones,
              activeMilestone: cached.milestones.find(m => m.status === 'active') || null,
            },
          });
          return cached.milestones;
        }

        set({ isLoading: true, error: null });
        try {
          const milestones = await roadmapApi.fetchRoadmap(epicId);
          const epic = get().epics.find(e => e.goalId === epicId) || null;
          const activeMilestone = milestones.find(m => m.status === 'active') || null;

          // Cache the results
          set({
            roadmapCache: {
              ...get().roadmapCache,
              [epicId]: {
                milestones,
                lastFetched: now,
                epic,
              },
            },
            activeRoadmap: {
              epicId,
              epic,
              milestones,
              activeMilestone,
            },
            isLoading: false,
          });

          // If there's an active milestone, fetch its tasks
          if (activeMilestone) {
            await get().fetchActiveMilestoneData();
          }

          return milestones;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch roadmap',
          });
          return [];
        }
      },

      generateRoadmap: async (epicId) => {
        try {
          await roadmapApi.generateRoadmap(epicId);
          // Update epic status to generating
          set((state) => ({
            epics: state.epics.map((e) =>
              e.goalId === epicId ? { ...e, roadmapStatus: 'generating' } : e
            ),
            goals: state.goals.map((g) =>
              g.goalId === epicId ? { ...g, roadmapStatus: 'generating' } : g
            ),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to generate roadmap',
          });
        }
      },

      // Milestone Actions
      completeMilestone: async (milestoneId) => {
        try {
          const updatedMilestone = await roadmapApi.completeMilestone(milestoneId);
          set((state) => ({
            activeRoadmap: {
              ...state.activeRoadmap,
              milestones: state.activeRoadmap.milestones.map((m) =>
                m.milestoneId === milestoneId ? updatedMilestone : m
              ),
            },
          }));

          // Activate next milestone if available
          const state = get();
          if (state.activeRoadmap.epicId) {
            await state.activateNextMilestone(state.activeRoadmap.epicId);
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to complete milestone',
          });
        }
      },

      activateNextMilestone: async (epicId) => {
        try {
          const state = get();
          const milestones = state.activeRoadmap.milestones;
          const nextMilestone = milestones.find(m => m.status === 'locked');

          if (nextMilestone) {
            // Update milestone status to active (this would be an API call in real implementation)
            const updatedMilestone: Milestone = { ...nextMilestone, status: 'active' };

            set((prevState) => ({
              activeRoadmap: {
                ...prevState.activeRoadmap,
                milestones: prevState.activeRoadmap.milestones.map((m) =>
                  m.milestoneId === nextMilestone.milestoneId ? updatedMilestone : m
                ),
                activeMilestone: updatedMilestone,
              },
            }));

            // Fetch new milestone's tasks
            await get().fetchActiveMilestoneData();
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to activate next milestone',
          });
        }
      },

      // Active Milestone Data Actions
      fetchActiveMilestoneData: async () => {
        const state = get();
        if (!state.activeRoadmap.activeMilestone) {
          set({ activeMilestoneTasks: [] });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const tasks = await roadmapApi.fetchMilestoneQuests(state.activeRoadmap.activeMilestone.milestoneId);
          set({
            activeMilestoneTasks: tasks,
            tasks: tasks, // Update legacy tasks for compatibility
            isLoading: false
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch milestone tasks',
          });
        }
      },

      // Legacy Actions (for compatibility)
      fetchTodayTasks: async (forceRefresh = false) => {
        set({ isLoading: true, error: null });
        try {
          const today = new Date().toISOString().split('T')[0];
          const response: any = await tasksApi.fetchTasksByDate(today);
          const tasks = Array.isArray(response) ? response : (response && Array.isArray(response.tasks) ? response.tasks : []);
          set({ tasks, isLoading: false, lastFetch: new Date().toISOString() });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : 'Failed to fetch tasks',
          });
        }
      },

      fetchGoals: async (forceRefresh = false) => {
        // Delegate to fetchEpics for consistency
        await get().fetchEpics(forceRefresh);
      },

      fetchTasksFromCache: () => {
        // No-op: zustand persist handles cache
      },

      markTaskComplete: async (taskId) => {
        try {
          const updated = await tasksApi.updateTask(taskId, {
            status: 'completed',
          });
          set((state) => ({
            activeMilestoneTasks: state.activeMilestoneTasks.map((t) =>
              t.taskId === taskId
                ? { ...t, ...updated, status: 'completed' }
                : t
            ),
            tasks: state.tasks.map((t) =>
              t.taskId === taskId
                ? { ...t, ...updated, status: 'completed' }
                : t
            ),
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to complete task',
          });
        }
      },

      markGoalComplete: async (goalId) => {
        try {
          const updated = await goalsApi.updateGoal(goalId, {
            status: 'completed',
          });
          set((state) => ({
            epics: state.epics.map((g) =>
              g.goalId === goalId
                ? { ...g, ...updated, status: 'completed' }
                : g
            ),
            goals: state.goals.map((g) =>
              g.goalId === goalId
                ? { ...g, ...updated, status: 'completed' }
                : g
            ),
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to complete goal',
          });
        }
      },

      createTask: async (taskData) => {
        set({ isLoading: true, error: null });
        try {
          const newTask = await tasksApi.createTask(taskData);
          set((state) => ({
            activeMilestoneTasks: [...state.activeMilestoneTasks, newTask],
            tasks: [...state.tasks, newTask],
            isLoading: false,
          }));
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : 'Failed to create task',
          });
        }
      },

      createGoal: async (goalData) => {
        // Delegate to createEpic for consistency
        await get().createEpic(goalData);
      },

      updateTask: async (taskId, data) => {
        try {
          const updated = await tasksApi.updateTask(taskId, data);
          set((state) => ({
            activeMilestoneTasks: state.activeMilestoneTasks.map((t) =>
              t.taskId === taskId ? { ...t, ...updated } : t
            ),
            tasks: state.tasks.map((t) =>
              t.taskId === taskId ? { ...t, ...updated } : t
            ),
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to update task',
          });
        }
      },

      updateGoal: async (goalId, data) => {
        try {
          const updated = await goalsApi.updateGoal(goalId, data);
          set((state) => ({
            epics: state.epics.map((g) =>
              g.goalId === goalId ? { ...g, ...updated } : g
            ),
            goals: state.goals.map((g) =>
              g.goalId === goalId ? { ...g, ...updated } : g
            ),
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to update goal',
          });
        }
      },

      deleteTask: async (taskId) => {
        try {
          await tasksApi.deleteTask(taskId);
          set((state) => ({
            activeMilestoneTasks: state.activeMilestoneTasks.filter((t) => t.taskId !== taskId),
            tasks: state.tasks.filter((t) => t.taskId !== taskId),
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to delete task',
          });
        }
      },

      deleteGoal: async (goalId) => {
        // Delegate to deleteEpic for consistency
        await get().deleteEpic(goalId);
      },

      clearError: () => set({ error: null }),

      // Cache management
      clearRoadmapCache: (epicId?: string) => {
        if (epicId) {
          set((state) => {
            const newCache = { ...state.roadmapCache };
            delete newCache[epicId];
            return { roadmapCache: newCache };
          });
        } else {
          set({ roadmapCache: {} });
        }
      },

      // Refresh actions
      refreshTodayData: async () => {
        set({ isRefreshing: true });
        try {
          await get().fetchTodayTasks(true);
          await get().fetchActiveMilestoneData();
        } finally {
          set({ isRefreshing: false });
        }
      },

      refreshQuestsData: async () => {
        set({ isRefreshing: true });
        try {
          await get().fetchEpics(true);
          // Clear roadmap cache to ensure fresh data
          get().clearRoadmapCache();
        } finally {
          set({ isRefreshing: false });
        }
      },

      resetState: () =>
        set({
          epics: [],
          roadmapCache: {},
          activeRoadmap: {
            epicId: null,
            epic: null,
            milestones: [],
            activeMilestone: null,
          },
          activeMilestoneTasks: [],
          goals: [],
          tasks: [],
          isLoading: false,
          isRefreshing: false,
          error: null,
          lastFetch: null,
          cacheExpiryTime: 5 * 60 * 1000,
        }),
    }),
    {
      name: 'task-goal-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist quest data but not loading states or errors
      partialize: (state) => ({
        epics: state.epics,
        activeRoadmap: state.activeRoadmap,
        activeMilestoneTasks: state.activeMilestoneTasks,
        goals: state.goals,
        tasks: state.tasks,
        lastFetch: state.lastFetch,
      }),
    }
  )
);

// New Selectors for Journey Planner
export const useEpics = () => {
  const epics = useTaskGoalStore((state) => state.epics);
  return Array.isArray(epics) ? epics : [];
};

export const useActiveRoadmap = () =>
  useTaskGoalStore((state) => state.activeRoadmap);

export const useActiveMilestoneTasks = () =>
  useTaskGoalStore((state) => state.activeMilestoneTasks);

// Refresh state selector
export const useIsRefreshing = () => useTaskGoalStore((state) => state.isRefreshing);

// Legacy Selectors (for compatibility)
export const useGoals = () => {
  const goals = useTaskGoalStore((state) => state.goals);
  return Array.isArray(goals) ? goals : [];
};

export const useTasks = () => useTaskGoalStore((state) => state.tasks);
export const useTaskGoalLoading = () =>
  useTaskGoalStore((state) => state.isLoading);
export const useTaskGoalError = () => useTaskGoalStore((state) => state.error);

// Enhanced Store Actions Access
export const getTaskGoalStoreActions = () => {
  const state = useTaskGoalStore.getState() as any;
  return {
    // New Journey Planner Actions
    fetchEpics: state.fetchEpics,
    createEpic: state.createEpic,
    deleteEpic: state.deleteEpic,
    fetchRoadmap: state.fetchRoadmap,
    generateRoadmap: state.generateRoadmap,
    completeMilestone: state.completeMilestone,
    activateNextMilestone: state.activateNextMilestone,
    fetchActiveMilestoneData: state.fetchActiveMilestoneData,
    clearRoadmapCache: state.clearRoadmapCache,
    refreshTodayData: state.refreshTodayData,
    refreshQuestsData: state.refreshQuestsData,

    // Legacy Actions (for compatibility)
    fetchTodayTasks: state.fetchTodayTasks,
    fetchGoals: state.fetchGoals,
    fetchTasksFromCache: state.fetchTasksFromCache,
    markTaskComplete: state.markTaskComplete,
    markGoalComplete: state.markGoalComplete,
    createTask: state.createTask,
    createGoal: state.createGoal,
    updateTask: state.updateTask,
    updateGoal: state.updateGoal,
    deleteTask: state.deleteTask,
    deleteGoal: state.deleteGoal,
    clearError: state.clearError,
    resetState: state.resetState,
  };
};
