import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meteringApi } from '../api/metering';
import type { Meter, MeterReading } from '../types';

export type { Meter, MeterReading };

export function useMeters(propertyId?: string | null, options: { enabled?: boolean } = {}) {
  const metersQuery = useQuery({
    queryKey: ['meters', propertyId],
    queryFn: () => {
      if (!propertyId) return [];
      return meteringApi.getMeters(propertyId);
    },
    enabled: options.enabled !== undefined ? options.enabled && !!propertyId : !!propertyId,
  });

  return {
    meters: metersQuery.data || [],
    isLoading: metersQuery.isLoading,
    error: metersQuery.error,
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
    queryFn: () => {
      if (!meterId) return [];
      return meteringApi.getMeterReadings(meterId, { per_page: months, sort: '-reading_date' });
    },
    enabled: !!meterId,
  });
}
