import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meteringApi } from '../api/metering';
import type { Meter, MeterReading } from '../types';
import toast from 'react-hot-toast';

export type { Meter, MeterReading };

export function useMeters(propertyId?: string | null, options: { 
  enabled?: boolean;
  filters?: Record<string, any>;
  search?: string;
  page?: number;
  perPage?: number;
} = {}) {
  const metersQuery = useQuery({
    queryKey: ['meters', propertyId, options.filters, options.search, options.page, options.perPage],
    queryFn: async () => {
      if (!propertyId) return { data: [], pagination: { total: 0, current_page: 1, last_page: 1, per_page: 15 } };
      const response = await meteringApi.getMeters(propertyId, options.filters, options.search, options.page, options.perPage);
      return response;
    },
    enabled: options.enabled !== undefined ? options.enabled && !!propertyId : !!propertyId,
  });

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
  // Bước 1: lấy danh sách meter IDs của property (dùng perPage cao để lấy hết)
  const metersQuery = useQuery({
    queryKey: ['meters-ids-for-readings', propertyId],
    queryFn: async () => {
      if (!propertyId) return [] as string[];
      const res = await meteringApi.getMeters(propertyId, {}, undefined, 1, 200);
      return (res.data ?? []).map((m: any) => m.id as string);
    },
    enabled: !!propertyId,
    staleTime: 60_000,
  });

  const meterIds = metersQuery.data ?? [];

  // Bước 2: fetch readings cho toàn bộ meters (chỉ chạy khi đã có meterIds)
  return useQuery({
    queryKey: ['property-readings', propertyId, params, meterIds.join(',')],
    queryFn: () => meteringApi.getReadingsForMeters(meterIds, params),
    enabled: !!propertyId && meterIds.length > 0,
    staleTime: 30_000,
  });
}

// Hook duyệt hàng loạt chốt số
export function useBulkApproveReadings(propertyId?: string | null) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: (items: { meterId: string; readingId: string }[]) =>
      meteringApi.bulkApproveReadings(items),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['property-readings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      if (result.failed > 0) {
        toast.error(`Duyệt thành công ${result.succeeded}, thất bại ${result.failed} chốt số.`);
      } else {
        toast.success(`Đã duyệt thành công ${result.succeeded} chốt số!`);
      }
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi duyệt chốt số.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ items, reason }: { items: { meterId: string; readingId: string }[]; reason?: string }) =>
      meteringApi.bulkRejectReadings(items, reason),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['property-readings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['meters', propertyId] });
      toast.success(`Đã từ chối ${result.succeeded} chốt số.`);
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi từ chối chốt số.');
    },
  });

  return { approveMutation, rejectMutation };
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
