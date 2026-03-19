import apiClient from '@/shared/api/client';
import type { DashboardResponse } from '../types';

export const dashboardApi = {
  getDashboardData: async (params: {
    propertyId?: string;
    organizationId?: string;
    dateRange?: { from: string; to: string };
  }): Promise<DashboardResponse> => {
    const queryParams = new URLSearchParams();
    if (params.propertyId) queryParams.append('property_id', params.propertyId);
    if (params.organizationId) queryParams.append('organization_id', params.organizationId);
    if (params.dateRange) {
      queryParams.append('from', params.dateRange.from);
      queryParams.append('to', params.dateRange.to);
    }

    const response = await apiClient.get(`/dashboard?${queryParams.toString()}`);
    return response.data;
  },
};
