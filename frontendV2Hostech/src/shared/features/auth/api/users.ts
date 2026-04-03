import apiClient from '@/shared/api/client';

export const usersApi = {
  getUsers: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  deleteUser: async (id: string) => {
    await apiClient.delete(`/users/${id}`);
  },

  toggleUserStatus: async (id: string, is_active: boolean) => {
    await apiClient.put(`/users/${id}`, { is_active });
  },
};
