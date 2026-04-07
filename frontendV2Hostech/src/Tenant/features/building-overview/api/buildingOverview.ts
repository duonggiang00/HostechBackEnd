import apiClient from '@/shared/api/client';
import type { BuildingOverviewResponse } from '@/PropertyScope/features/building-overview/types';

/**
 * Tenant Building Overview API
 * REST endpoints for residents to view their building layout.
 */
export const tenantBuildingOverviewApi = {
  /**
   * GET /api/app/building-overview
   * Fetch current resident's property building layout (grid and units).
   */
  getOverview: async (signal?: AbortSignal): Promise<BuildingOverviewResponse> => {
    const { data } = await apiClient.get('app/building-overview', { signal });
    return data.data ?? data;
  },
};
