import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Goal } from '../api/quests';
import { tasksApi, goalsApi } from '../api/quests';

interface TaskGoalState {
  goals: Goal[];
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  lastFetch: string | null;
  fetchTodayTasks: () => Promise<void>;
  fetchGoals: () => Promise<void>;
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
      goals: [],
      tasks: [],
      isLoading: false,
      error: null,
      lastFetch: null,
      fetchTodayTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          const today = new Date().toISOString().split('T')[0];
          const response: any = await tasksApi.fetchTasksByDate(today);
          const tasks = Array.isArray(response) ? response : (response && Array.isArray(response.tasks) ? response.tasks : []);
          console.log('[DEBUG] fetched tasks:', tasks);
          set({ tasks, isLoading: false, lastFetch: new Date().toISOString() });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : 'Failed to fetch tasks',
          });
        }
      },
      fetchGoals: async () => {
        set({ isLoading: true, error: null });
        try {
          const response: any = await goalsApi.fetchGoals();
          const goals = Array.isArray(response) ? response : (response && Array.isArray(response.goals) ? response.goals : []);
          console.log('[DEBUG] fetched goals:', goals);
          set({ goals, isLoading: false, lastFetch: new Date().toISOString() });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : 'Failed to fetch goals',
          });
        }
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
        set({ isLoading: true, error: null });
        try {
          const newGoal = await goalsApi.createGoal(goalData);
          set((state) => ({
            goals: [...state.goals, newGoal],
            isLoading: false,
          }));
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : 'Failed to create goal',
          });
        }
      },
      updateTask: async (taskId, data) => {
        try {
          const updated = await tasksApi.updateTask(taskId, data);
          set((state) => ({
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
        try {
          await goalsApi.deleteGoal(goalId);
          set((state) => ({
            goals: state.goals.filter((g) => g.goalId !== goalId),
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to delete goal',
          });
        }
      },
      clearError: () => set({ error: null }),
      resetState: () =>
        set({
          goals: [],
          tasks: [],
          isLoading: false,
          error: null,
          lastFetch: null,
        }),
    }),
    {
      name: 'task-goal-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist quest data but not loading states or errors
      partialize: (state) => ({
        goals: state.goals,
        tasks: state.tasks,
        lastFetch: state.lastFetch,
      }),
    }
  )
);

// Selectors for better performance
export const useGoals = () => {
  const goals = useTaskGoalStore((state) => state.goals);
  return Array.isArray(goals) ? goals : [];
};
export const useTasks = () => useTaskGoalStore((state) => state.tasks);
export const useTaskGoalLoading = () =>
  useTaskGoalStore((state) => state.isLoading);
export const useTaskGoalError = () => useTaskGoalStore((state) => state.error);

// Direct store access for actions (workaround for persist typing issues)
export const getTaskGoalStoreActions = () => {
  const state = useTaskGoalStore.getState() as any;
  return {
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
