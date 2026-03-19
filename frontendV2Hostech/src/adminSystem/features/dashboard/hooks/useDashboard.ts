import { useQuery } from '@tanstack/react-query';
import { useScopeStore } from '@/shared/stores/useScopeStore';
import { dashboardApi } from '../api/dashboard';
import type { DashboardResponse } from '../types';

export function useDashboard(dateRange?: { from: string; to: string }) {
  const { propertyId, organizationId } = useScopeStore();

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

