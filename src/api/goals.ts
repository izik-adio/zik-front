// Backward compatibility wrapper for goals API
// This file provides the old goals API interface while using the new unified quests API

import { goalsApi as newGoalsApi, Goal as NewGoal } from './quests';

/**
 * @deprecated Use questsApi from './quests' instead
 * This interface is maintained for backward compatibility
 */
export interface Goal {
  goalId: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
}

/**
 * @deprecated Use questsApi.createGoal from './quests' instead
 */
export interface CreateGoalData {
  title: string;
  description: string;
  category: string;
}

/**
 * @deprecated Use questsApi.updateGoal from './quests' instead
 */
export interface UpdateGoalData {
  title?: string;
  description?: string;
  category?: string;
  status?: string;
}

/**
 * @deprecated Use questsApi from './quests' instead
 * This API is maintained for backward compatibility during migration
 */
export const goalsApi = {
  /**
   * @deprecated Use questsApi.fetchTasksByDate or implement goals fetching via the new API
   */
  async getGoals(): Promise<Goal[]> {
    console.warn(
      'goalsApi.getGoals is deprecated. Please migrate to the new questsApi.'
    );
    // Note: The new API doesn't have a generic "get all goals" endpoint
    // Components should be updated to fetch goals based on specific criteria
    // For now, return empty array to maintain compatibility
    return [];
  },

  /**
   * @deprecated Use questsApi.createGoal instead
   */
  async createGoal(goalData: CreateGoalData): Promise<Goal> {
    console.warn(
      'goalsApi.createGoal is deprecated. Please migrate to questsApi.createGoal.'
    );

    // Transform old interface to new interface
    const newGoalData = {
      title: goalData.title,
      description: goalData.description,
      category: goalData.category,
      dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // Default to 1 year from now
    };

    const createdGoal = await newGoalsApi.createGoal(newGoalData); // Transform new interface back to old interface for compatibility
    return {
      goalId: createdGoal.goalId,
      userId: createdGoal.userId,
      title: (createdGoal as any).goalName,
      description: createdGoal.description,
      category: createdGoal.category,
      status: createdGoal.status,
      createdAt: createdGoal.createdAt,
    } as Goal;
  },

  /**
   * @deprecated Use questsApi.updateGoal instead
   */
  async updateGoal(goalId: string, updatedData: UpdateGoalData): Promise<Goal> {
    console.warn(
      'goalsApi.updateGoal is deprecated. Please migrate to questsApi.updateGoal.'
    );

    // Transform old interface to new interface
    const newUpdateData: any = {};
    if (updatedData.title) newUpdateData.title = updatedData.title;
    if (updatedData.description)
      newUpdateData.description = updatedData.description;
    if (updatedData.category) newUpdateData.category = updatedData.category;
    if (updatedData.status) {
      // Map old status values to new ones if needed
      const statusMap: { [key: string]: 'active' | 'completed' | 'paused' } = {
        active: 'active',
        completed: 'completed',
        paused: 'paused',
        pending: 'active', // Legacy mapping
      };
      newUpdateData.status = statusMap[updatedData.status] || 'active';
    }

    const updatedGoal = await newGoalsApi.updateGoal(goalId, newUpdateData); // Transform new interface back to old interface for compatibility
    return {
      goalId: updatedGoal.goalId,
      userId: updatedGoal.userId,
      title: (updatedGoal as any).goalName,
      description: updatedGoal.description,
      category: updatedGoal.category,
      status: updatedGoal.status,
      createdAt: updatedGoal.createdAt,
    } as Goal;
  },

  /**
   * @deprecated Use questsApi.deleteGoal instead
   */
  async deleteGoal(goalId: string): Promise<void> {
    console.warn(
      'goalsApi.deleteGoal is deprecated. Please migrate to questsApi.deleteGoal.'
    );
    return newGoalsApi.deleteGoal(goalId);
  },
};
