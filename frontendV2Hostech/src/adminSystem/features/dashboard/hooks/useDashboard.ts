import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';
import type { DashboardResponse } from '../types';

export function useDashboard(propertyId?: string | null, organizationId?: string | null, dateRange?: { from: string; to: string }) {
  return useQuery<DashboardResponse>({
    queryKey: ['dashboard-stats', propertyId, organizationId, dateRange],
    queryFn: async () => {
      return dashboardApi.getDashboardData({
        propertyId: propertyId ?? undefined,
        organizationId: organizationId ?? undefined,
        dateRange,
      });
    },
  });
}

