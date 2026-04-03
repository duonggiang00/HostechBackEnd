import apiClient from '@/shared/api/client';
import type { Organization, InvitationValidation } from '../types';

export const organizationsApi = {
  getOrganizations: async () => {
    const response = await apiClient.get('/orgs');
    return (response.data.data || response.data) as Organization[];
  },

  getInvitations: async () => {
    const response = await apiClient.get('/system/invitations');
    return response.data;
  },

  createInvitation: async (data: { email: string; role_name: string; org_id?: string; properties_scope?: string[] }) => {
    const response = await apiClient.post('/system/invitations', data);
    return response.data;
  },

  validateToken: async (token: string): Promise<InvitationValidation> => {
    const response = await apiClient.get(`/system/invitations/validate/${token}`);
    return response.data.data;
  },

  revokeInvitation: async (id: string) => {
    await apiClient.delete(`/system/invitations/${id}`);
  },

  acceptInvitation: async (data: { token: string; full_name: string; password: string; password_confirmation: string; org_name?: string }) => {
    const response = await apiClient.post(`/system/invitations/accept/${data.token}`, data);
    return response.data;
  },
};
