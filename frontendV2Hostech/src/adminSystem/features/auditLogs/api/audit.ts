import apiClient from '@/shared/api/client';

export interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  subject_type: string;
  subject_id: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export const auditApi = {
  getAuditLogs: async (params?: { page?: number; per_page?: number }) => {
    const response = await apiClient.get('/system/audit-logs', { params });
    return response.data;
  },
};
