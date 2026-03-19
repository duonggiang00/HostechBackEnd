import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface Handover {
  id: string;
  contract_id: string;
  type: 'check_in' | 'check_out';
  status: 'draft' | 'confirmed';
  handover_date: string;
  notes: string | null;
  items?: HandoverItem[];
  snapshots?: HandoverSnapshot[];
}

export interface HandoverItem {
  id?: string;
  name: string;
  condition: 'good' | 'fair' | 'poor' | 'broken';
  notes: string | null;
}

export interface HandoverSnapshot {
  id?: string;
  meter_id?: string;
  meter_type?: string; 
  reading_value: number | string;
  reading_date?: string;
  unit?: string;
}

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
