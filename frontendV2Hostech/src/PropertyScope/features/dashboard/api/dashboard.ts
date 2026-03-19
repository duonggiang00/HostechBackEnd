import apiClient from '@/shared/api/client';
import type { PropertyDashboardData } from '../types';

export const dashboardApi = {
  getDashboardData: async (propertyId: string): Promise<PropertyDashboardData> => {
    const response = await apiClient.get<{ data: PropertyDashboardData }>('dashboard/manager', {
      params: { 
        property_id: propertyId,
      }
    });

    return response.data.data;
  },
};
