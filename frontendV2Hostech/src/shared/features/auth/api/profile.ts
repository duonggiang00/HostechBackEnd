import apiClient from '@/shared/api/client';

export const profileApi = {
  getProfile: async () => {
    const response = await apiClient.get('/org/profile');
    return response.data.data;
  },
};
