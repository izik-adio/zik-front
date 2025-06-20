import api from './axios';

export interface Quest {
  questId: string;
  userId: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestData {
  title: string;
  description: string;
}

export interface UpdateQuestData {
  title?: string;
  description?: string;
  status?: string;
}

export const questsApi = {
  async getQuests(): Promise<Quest[]> {
    const response = await api.get('/quests');
    return response.data;
  },

  async createQuest(questData: CreateQuestData): Promise<Quest> {
    const response = await api.post('/quests', questData);
    return response.data;
  },

  async updateQuest(questId: string, updatedData: UpdateQuestData): Promise<Quest> {
    const response = await api.put(`/quests/${questId}`, updatedData);
    return response.data;
  },

  async deleteQuest(questId: string): Promise<void> {
    await api.delete(`/quests/${questId}`);
  },
};