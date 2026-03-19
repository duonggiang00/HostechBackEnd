import apiClient from '@/shared/api/client';

export interface Session {
  id: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
  is_current: boolean;
  abilities: string[];
}

export const sessionsApi = {
  getSessions: async () => {
    const response = await apiClient.get('/system/sessions');
    return response.data.data as Session[];
  },

  revokeSession: async (id: string) => {
    await apiClient.delete(`/system/sessions/${id}`);
  },

  revokeOthers: async () => {
    await apiClient.post('/system/sessions/revoke-others', {});
  },
};
