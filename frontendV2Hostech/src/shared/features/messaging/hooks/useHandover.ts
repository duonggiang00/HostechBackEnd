import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Handover, HandoverItem, HandoverSnapshot } from '../types';

export function useHandover() {
  const queryClient = useQueryClient();

  const useHandovers = (filters?: any) => useQuery({
    queryKey: ['handovers', filters],
    queryFn: async () => {
      const response = await axios.get('/api/handovers', { params: filters });
      return response.data;
    }
  });

  const useHandoverDetails = (id: string) => useQuery({
    queryKey: ['handover', id],
    queryFn: async () => {
      const response = await axios.get(`/api/handovers/${id}`);
      return response.data.data as Handover;
    },
    enabled: !!id,
  });

  const createHandover = useMutation({
    mutationFn: async (data: Partial<Handover>) => {
      const response = await axios.post('/api/handovers', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
    }
  });

  const confirmHandover = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.post(`/api/handovers/${id}/confirm`);
      return response.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
      queryClient.invalidateQueries({ queryKey: ['handover', id] });
    }
  });

  const addItem = useMutation({
    mutationFn: async ({ handoverId, data }: { handoverId: string, data: any }) => {
      const response = await axios.post(`/api/handovers/${handoverId}/items`, data);
      return response.data.data;
    },
    onSuccess: (_, { handoverId }) => {
      queryClient.invalidateQueries({ queryKey: ['handover', handoverId] });
    }
  });

  const addSnapshot = useMutation({
    mutationFn: async ({ handoverId, data }: { handoverId: string, data: any }) => {
      const response = await axios.post(`/api/handovers/${handoverId}/snapshots`, data);
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
