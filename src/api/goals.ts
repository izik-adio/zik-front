import api from './axios';

export interface Goal {
  goalId: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
}

export interface CreateGoalData {
  title: string;
  description: string;
  category: string;
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  category?: string;
  status?: string;
}

export const goalsApi = {
  async getGoals(): Promise<Goal[]> {
    const response = await api.get('/goals');
    return response.data;
  },

  async createGoal(goalData: CreateGoalData): Promise<Goal> {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  async updateGoal(goalId: string, updatedData: UpdateGoalData): Promise<Goal> {
    const response = await api.put(`/goals/${goalId}`, updatedData);
    return response.data;
  },

  async deleteGoal(goalId: string): Promise<void> {
    await api.delete(`/goals/${goalId}`);
  },
};