import apiClient from '@/shared/api/client';
import type { PropertyUser, UserInvitation } from '../types';

export const usersApi = {
  getUsers: async (): Promise<PropertyUser[]> => {
    // Fetch users for the current org/property. 
    // The X-Org-Id and X-Property-Id headers are automatically injected by apiClient interceptor based on the URL.
    const response = await apiClient.get('/users', {
      params: {
        per_page: 100,
      }
    });
    return response.data.data;
  },

  getInvitations: async (): Promise<UserInvitation[]> => {
    const response = await apiClient.get('/user-invitations', {
      params: {
        per_page: 100,
      }
    });
    return response.data.data;
  },

  inviteUser: async (data: { email: string; role_name: string; properties_scope: string[] }) => {
    // properties_scope is required for Manager role inviting Staff/Tenant
    // org_id is also usually appended by the server if logged in as Owner/Manager
    const response = await apiClient.post('/user-invitations', data);
    return response.data.data;
  },

  createUser: async (data: any) => {
    const response = await apiClient.post('/users', data);
    return response.data.data;
  },

  revokeInvitation: async (id: string) => {
    const response = await apiClient.delete(`/user-invitations/${id}`);
    return response.data;
  }
};
