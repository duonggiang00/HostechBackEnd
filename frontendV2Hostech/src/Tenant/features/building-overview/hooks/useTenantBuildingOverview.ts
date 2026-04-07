import { useQuery } from '@tanstack/react-query';
import { tenantBuildingOverviewApi } from '../api/buildingOverview';

// --- Query Keys ---
export const TENANT_BUILDING_OVERVIEW_KEY = 'tenant-building-overview';

/**
 * Hook to retrieve the current building layout for the resident.
 * GET /api/app/building-overview
 */
export const useTenantBuildingOverview = () => {
  return useQuery({
    queryKey: [TENANT_BUILDING_OVERVIEW_KEY],
    queryFn: ({ signal }) => tenantBuildingOverviewApi.getOverview(signal),
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
  });
};
