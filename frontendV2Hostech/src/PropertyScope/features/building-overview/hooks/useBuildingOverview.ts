import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildingOverviewApi } from '../api/buildingOverview';
import type { SyncBuildingOverviewPayload } from '../types';
import { isUuid } from '@/lib/utils';
import toast from 'react-hot-toast';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const BUILDING_OVERVIEW_KEY = 'building-overview';

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * GET /api/properties/{id}/overview
 */
export const useBuildingOverview = (propertyId?: string) => {
  return useQuery({
    queryKey: [BUILDING_OVERVIEW_KEY, propertyId],
    queryFn: ({ signal }) => buildingOverviewApi.getOverview(propertyId!, signal),
    enabled: isUuid(propertyId),
    staleTime: 5 * 60 * 1000, // 5 phút (khớp với cache backend)
  });
};

/**
 * POST /api/properties/{id}/overview/sync
 * Batch save: tạo tầng/phòng, cập nhật vị trí Grid, xóa đối tượng
 */
export const useSyncBuildingOverview = (propertyId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SyncBuildingOverviewPayload) =>
      buildingOverviewApi.syncOverview(propertyId!, payload),

    onSuccess: () => {
      // Làm mới dữ liệu overview và rooms sau khi sync thành công
      queryClient.invalidateQueries({ queryKey: [BUILDING_OVERVIEW_KEY, propertyId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      toast.success('Đã lưu mặt bằng thành công!');
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Lưu mặt bằng thất bại. Vui lòng thử lại.');
    },
  });
};
