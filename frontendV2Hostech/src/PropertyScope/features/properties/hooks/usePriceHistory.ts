import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import type { PricePeriod } from '../types';

export function usePriceHistory(roomId: string) {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ['price-history', roomId],
    queryFn: async () => {
      const response = await apiClient.get(`/rooms/${roomId}/price-histories`);
      const periods = response.data.data as any[];
      
      return periods.map(p => ({
        ...p,
        startDate: p.start_date,
        endDate: p.end_date,
        status: p.status || deriveStatus(p),
      })) as PricePeriod[];
    },
    enabled: !!roomId,
  });

  const addPricePeriod = useMutation({
    mutationFn: async (newPeriod: { price: number, start_date: string, end_date?: string | null }) => {
      const response = await apiClient.post(`/rooms/${roomId}/price-histories`, newPeriod);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-history', roomId] });
    },
  });

  const deletePricePeriod = useMutation({
    mutationFn: async (periodId: string) => {
      await apiClient.delete(`/rooms/${roomId}/price-histories/${periodId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-history', roomId] });
    },
  });

  return {
    history: historyQuery.data || [],
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
    addPricePeriod,
    deletePricePeriod,
  };
}

function deriveStatus(period: any): 'active' | 'scheduled' | 'expired' {
  const now = new Date();
  const start = new Date(period.start_date);
  const end = period.end_date ? new Date(period.end_date) : null;

  if (start > now) return 'scheduled';
  if (end && end < now) return 'expired';
  return 'active';
}
