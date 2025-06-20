import api from './axios';

export interface Profile {
  userId: string;
  userName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  userName?: string;
  email?: string;
}

export const profileApi = {
  async getProfile(): Promise<Profile> {
    const response = await api.get('/profile');
    return response.data;
  },

  async updateProfile(updatedData: UpdateProfileData): Promise<Profile> {
    const response = await api.put('/profile', updatedData);
    return response.data;
  },
};