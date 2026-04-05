import apiClient from '@/shared/api/client';
import type { SyncBuildingOverviewPayload, BuildingOverviewResponse } from '../types';

const BASE = 'properties';

export const buildingOverviewApi = {
  /**
   * GET /api/properties/{id}/overview
   * Lấy cấu trúc lưới tòa nhà (Property → Floors → Rooms + positions)
   */
  getOverview: async (propertyId: string, signal?: AbortSignal): Promise<BuildingOverviewResponse> => {
    const { data } = await apiClient.get(`${BASE}/${propertyId}/overview`, { signal });
    return data.data ?? data;
  },

  /**
   * POST /api/properties/{id}/overview/sync
   * Batch sync: tạo tầng/phòng mới, cập nhật vị trí, xóa đối tượng
   */
  syncOverview: async (propertyId: string, payload: SyncBuildingOverviewPayload): Promise<BuildingOverviewResponse> => {
    const { data } = await apiClient.post(`${BASE}/${propertyId}/overview/sync`, payload);
    return data.data ?? data;
  },
};
