import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import type { Handover } from '../types';

export function useHandover() {
  const queryClient = useQueryClient();

  const useHandovers = (filters?: any) => useQuery({
    queryKey: ['handovers', filters],
    queryFn: async () => {
      const response = await apiClient.get('/handovers', { params: filters });
      return response.data;
    }
  });

  const useHandoverDetails = (id: string) => useQuery({
    queryKey: ['handover', id],
    queryFn: async () => {
      const response = await apiClient.get(`/handovers/${id}`);
      return response.data.data as Handover;
    },
    enabled: !!id,
  });

  const createHandover = useMutation({
    mutationFn: async (data: Partial<Handover>) => {
      const response = await apiClient.post('/handovers', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
    }
  });

  const confirmHandover = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/handovers/${id}/confirm`);
      return response.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
      queryClient.invalidateQueries({ queryKey: ['handover', id] });
    }
  });

  const addItem = useMutation({
    mutationFn: async ({ handoverId, data }: { handoverId: string, data: any }) => {
      const response = await apiClient.post(`/handovers/${handoverId}/items`, data);
      return response.data.data;
    },
    onSuccess: (_, { handoverId }) => {
      queryClient.invalidateQueries({ queryKey: ['handover', handoverId] });
    }
  });

  const addSnapshot = useMutation({
    mutationFn: async ({ handoverId, data }: { handoverId: string, data: any }) => {
      const response = await apiClient.post(`/handovers/${handoverId}/snapshots`, data);
      return response.data.data;
    },
    onSuccess: (_, { handoverId }) => {
      queryClient.invalidateQueries({ queryKey: ['handover', handoverId] });
    }
  });

  return {
    useHandovers,
    useHandoverDetails,
    createHandover,
    confirmHandover,
    addItem,
    addSnapshot
  };
}
