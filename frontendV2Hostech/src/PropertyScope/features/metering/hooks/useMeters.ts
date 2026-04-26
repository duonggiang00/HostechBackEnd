import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meteringApi } from '../api/metering';
import type { Meter, MeterReading } from '../types';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { echo } from '@/shared/utils/echo';

export type { Meter, MeterReading };

export function useMeters(propertyId?: string | null, options: {
  enabled?: boolean;
  filters?: Record<string, any>;
  search?: string;
  page?: number;
  perPage?: number;
} = {}) {
  const queryClient = useQueryClient();

  const metersQuery = useQuery({
    queryKey: ['meters', propertyId, options.filters, options.search, options.page, options.perPage],
    queryFn: async () => {
      if (!propertyId) return { data: [], pagination: { total: 0, current_page: 1, last_page: 1, per_page: 15 } };
      const response = await meteringApi.getMeters(propertyId, options.filters, options.search, options.page, options.perPage);
      return response;
    },
    enabled: options.enabled !== undefined ? options.enabled && !!propertyId : !!propertyId,
  });

  // Real-time synchronization
  useEffect(() => {
    if (!echo || !propertyId || !options.enabled) return;

    const channel = echo.private(`property.${propertyId}`);
    
    // Listen for single approved event (legacy/individual)
    channel.listen('.meter-reading.approved', () => {
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-readings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pending-readings-count', propertyId] });
    });

    // Listen for bulk approved event (new)
    channel.listen('.meter-readings.bulk_approved', () => {
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-readings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pending-readings-count', propertyId] });
      toast.success('Dữ liệu chỉ số đã được cập nhật (hàng loạt)');
    });

    // Listen for any status change (submitted, rejected, etc.)
    channel.listen('.meter-reading.status_changed', () => {
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-readings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pending-readings-count', propertyId] });
    });

    return () => {
      channel.stopListening('.meter-reading.approved');
      channel.stopListening('.meter-readings.bulk_approved');
      channel.stopListening('.meter-reading.status_changed');
    };
  }, [echo, propertyId, options.enabled, queryClient]);

  return {
    meters: metersQuery.data?.data || [],
    pagination: metersQuery.data?.pagination || { total: 0, current_page: 1, last_page: 1, per_page: 15 },
    isLoading: metersQuery.isLoading,
    error: metersQuery.error,
  };
}

export function useMeterActions(propertyId?: string | null) {
  const queryClient = useQueryClient();

  const createMeterMutation = useMutation({
    mutationFn: (data: Partial<Meter>) => meteringApi.createMeter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      toast.success('Tạo đồng hồ thành công');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo đồng hồ');
    },
  });

  const updateMeterMutation = useMutation({
    mutationFn: ({ meterId, data }: { meterId: string; data: Partial<Meter> }) =>
      meteringApi.updateMeter(meterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      toast.success('Cập nhật đồng hồ thành công');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật đồng hồ');
    },
  });

  const deleteMeterMutation = useMutation({
    mutationFn: (meterId: string) => meteringApi.deleteMeter(meterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      toast.success('Xóa đồng hồ thành công');
      // Trigger a refetch to update UI
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['meters', propertyId] });
      }, 300);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa đồng hồ');
    },
  });

  const bulkCreateReadingsMutation = useMutation({
    mutationFn: (data: any[]) => meteringApi.bulkCreateReadings(propertyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
    },
  });

  return {
    createMeter: createMeterMutation.mutate,
    createMeterAsync: createMeterMutation.mutateAsync,
    isCreating: createMeterMutation.isPending,
    updateMeter: updateMeterMutation.mutate,
    updateMeterAsync: updateMeterMutation.mutateAsync,
    isUpdating: updateMeterMutation.isPending,
    deleteMeter: deleteMeterMutation.mutate,
    deleteMeterAsync: deleteMeterMutation.mutateAsync,
    isDeleting: deleteMeterMutation.isPending,
    bulkCreateReadings: bulkCreateReadingsMutation,
  };
}

export function useMeterReadings(meterId?: string | null) {
  const queryClient = useQueryClient();

  const readingsQuery = useQuery({
    queryKey: ['meter-readings', meterId],
    queryFn: () => {
      if (!meterId) return [];
      return meteringApi.getMeterReadings(meterId);
    },
    enabled: !!meterId,
  });

  const addReading = useMutation({
    mutationFn: (newReading: { reading_value: number; reading_date: string; photo?: File }) =>
      meteringApi.addReading(meterId!, newReading.reading_value, newReading.reading_date, newReading.photo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meter-readings', meterId] });
      queryClient.invalidateQueries({ queryKey: ['meters'] });
      toast.success('Thêm chỉ số thành công');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm chỉ số');
    },
  });

  return {
    readings: readingsQuery.data || [],
    isLoading: readingsQuery.isLoading,
    error: readingsQuery.error,
    addReading,
  };
}

export function useMeterHistory(meterId?: string | null, months: number = 12) {
  return useQuery({
    queryKey: ['meter-history', meterId, months],
    queryFn: async () => {
      if (!meterId) return [];
      try {
        // Fetch meter readings with proper pagination
        const response = await meteringApi.getMeterReadings(meterId, 1, months);

        // Handle different response formats
        let readingsList = [];
        if (Array.isArray(response)) {
          readingsList = response;
        } else if (response?.data && Array.isArray(response.data)) {
          readingsList = response.data;
        } else if (response?.readings && Array.isArray(response.readings)) {
          readingsList = response.readings;
        }

        return readingsList;
      } catch (error) {
        console.error('Error fetching meter history:', error);
        return [];
      }
    },
    enabled: !!meterId,
  });
}

// Hook lấy danh sách readings theo status cho toàn property
// Step 1: lấy meters, Step 2: fetch readings từng meter song song
export function usePropertyReadings(
  propertyId?: string | null,
  params?: { status?: string; period_start?: string; period_end?: string }
) {
  return useQuery({
    queryKey: ['property-readings', propertyId, params],
    queryFn: () =>
      meteringApi.getReadingsForMeters([], {
        ...params,
        property_id: propertyId as string,
      }),
    enabled: !!propertyId,
    staleTime: 30_000,
  });
}

/**
 * Hook lấy số lượng bản ghi đang chờ duyệt (Pending) - Tối ưu hóa cực độ.
 */
export function usePendingReadingsCount(propertyId?: string | null) {
  return useQuery({
    queryKey: ['pending-readings-count', propertyId],
    queryFn: async () => {
      if (!propertyId) return 0;
      const res = await meteringApi.getGlobalReadings({
        property_id: propertyId,
        status: 'SUBMITTED',
        per_page: 1, // Chỉ lấy meta.total
      });
      return res.meta?.total || 0;
    },
    enabled: !!propertyId,
    refetchInterval: 60_000, // Tự động làm mới mỗi phút
  });
}

// Hook duyệt hàng loạt chốt số
export function useBulkApproveReadings(propertyId?: string | null) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: (readingIds: string[]) =>
      meteringApi.bulkApproveReadings(readingIds),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['property-readings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pending-readings-count', propertyId] });
      
      const count = Array.isArray(result) ? result.length : (result.count || 0);
      toast.success(`Đã duyệt thành công ${count || 'các'} chốt số!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi duyệt chốt số.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ readingIds, reason }: { readingIds: string[]; reason?: string }) =>
      meteringApi.bulkRejectReadings(readingIds, reason),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['property-readings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pending-readings-count', propertyId] });

      const count = Array.isArray(result) ? result.length : (result.count || 0);
      toast.success(`Đã từ chối ${count || 'các'} chốt số.`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối chốt số.');
    },
  });

  return { approveMutation, rejectMutation };
}

// Hook sửa hàng loạt (dùng cho resubmit)
export function useBulkUpdateReadings(propertyId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: { id: string; reading_value?: number; period_start?: string; period_end?: string; status?: string }[]) =>
      meteringApi.bulkUpdateReadings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-readings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      toast.success('Cập nhật hàng loạt thành công!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật hàng loạt');
    },
  });
}

// Hook gửi duyệt hàng loạt (DRAFT → SUBMITTED) cho Staff
export function useBulkSubmitReadings(propertyId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (readingIds: string[]) => meteringApi.bulkSubmitReadings(readingIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-readings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      toast.success('Đã gửi duyệt hàng loạt thành công!');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi gửi duyệt.');
    },
  });
}
