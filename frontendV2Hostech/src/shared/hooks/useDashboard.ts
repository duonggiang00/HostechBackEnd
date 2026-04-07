import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';

export interface DashboardData {
  role: string;
  data: {
    filter: {
      from: string;
      to: string;
    };
    revenue?: {
      current_period: number;
      previous_period: number;
      change_percent: number;
    };
    properties?: {
      total_properties: number;
      total_rooms: number;
      occupied_rooms: number;
      available_rooms: number;
      occupancy_rate: number;
    };
    staff?: {
      total_managers: number;
      total_staff: number;
      active_now: number;
    };
    contracts?: {
      total_active: number;
      expiring_soon: number;
      new_this_month: number;
    };
    tickets?: {
      total: number;
      pending: number;
      in_progress: number;
      resolved: number;
      mttr_hours?: number;
    };
    [key: string]: any;
  };
}

export const useDashboard = (params?: Record<string, any>) => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', params],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard', { params });
      return response.data;
    },
  });
};
