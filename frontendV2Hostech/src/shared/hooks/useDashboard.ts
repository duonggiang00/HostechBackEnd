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
      /** Backend owner dashboard */
      managers?: number;
      staff?: number;
      total?: number;
      /** Legacy / admin-style */
      total_managers?: number;
      total_staff?: number;
      active_now?: number;
    };
    invoices?: {
      outstanding_debt: number;
      draft_pipeline_total: number;
      /** Tổng paid_amount các hóa đơn PAID có updated_at trong tháng hiện tại (tiền thu thực tế). */
      revenue_this_month?: number;
      recent_paid: Array<{
        id: string;
        paid_amount: number;
        updated_at?: string | null;
        counterparty_label: string;
      }>;
      revenue_last_6_months: Array<{
        month_key: string;
        month_short: string;
        revenue: number;
      }>;
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
