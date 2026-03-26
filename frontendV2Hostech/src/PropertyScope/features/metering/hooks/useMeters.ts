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
