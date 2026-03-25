import apiClient from '@/shared/api/client';
import type { PropertyUser, UserInvitation, PaginatedResponse } from '../types';

export const usersApi = {
  getUsers: async (params?: Record<string, any>): Promise<PaginatedResponse<PropertyUser>> => {
    // Lấy danh sách người dùng (Interceptor tự động gắp X-Property-Id)
    const response = await apiClient.get('/users', {
      params: {
        page: params?.page || 1,
        per_page: params?.per_page || 15,
        search: params?.search || '',
        ...params,
      }
    });
    console.log('📡 API: GET /users - Data:', response.data);
    return response.data;
  },

  getInvitations: async (params?: Record<string, any>): Promise<PaginatedResponse<UserInvitation>> => {
    const response = await apiClient.get('/invitations', {
      params: {
        page: params?.page || 1,
        per_page: params?.per_page || 15,
        ...params,
      }
    });
    console.log('📡 API: GET /invitations - Data:', response.data);
    return response.data;
  },

  inviteUser: async (data: { email: string; role_name: string; properties_scope: string[] }) => {
    // Truyền properties_scope để gắn user vào đúng tòa nhà
    const response = await apiClient.post('/invitations', data);
    return response.data.data;
  },

  createUser: async (data: any) => {
    const response = await apiClient.post('/users', data);
    return response.data.data;
  },

  getUser: async (id: string): Promise<PropertyUser> => {
    const response = await apiClient.get(`/users/${id}`);
    console.log(`📡 API: GET /users/${id} detail:`, response.data.data);
    return response.data.data;
  },

  updateUser: async (id: string, data: Partial<PropertyUser>) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data;
  },

  revokeInvitation: async (id: string) => {
    const response = await apiClient.delete(`/invitations/${id}`);
    return response.data;
  }
};
