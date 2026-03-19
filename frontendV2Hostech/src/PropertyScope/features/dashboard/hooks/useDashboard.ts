import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';

export const useDashboard = (propertyId: string | undefined) => {
  return useQuery({
    queryKey: ['property-dashboard', propertyId],
    queryFn: () => {
      if (!propertyId) throw new Error('Property ID is required');
      return dashboardApi.getDashboardData(propertyId);
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
