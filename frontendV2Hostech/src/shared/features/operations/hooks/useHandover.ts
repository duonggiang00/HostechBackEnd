import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';

export interface Handover {
  id: string;
  org_id: string;
  contract_id: string | null;
  room_id: string | null;
  /** Chỉ dùng cho bàn giao kết thúc hợp đồng (OUT). Legacy có thể trả CHECKOUT/CHECKIN. */
  type: 'OUT' | 'CHECKOUT' | 'IN' | 'CHECKIN';
  /** "DRAFT" | "COMPLETED" (một số luồng UI dùng CONFIRMED tương đương đã chốt) */
  status: 'DRAFT' | 'COMPLETED' | 'CONFIRMED';
  note: string | null;
  confirmed_by_user_id: string | null;
  confirmed_at: string | null;
  locked_at: string | null;
  document_scan_urls: string[];
  created_at: string;
  updated_at: string;
  // Loaded via include=room,contract,confirmedBy
  room?: {
    id: string;
    name: string;
    code: string;
    property?: { id: string; name: string };
  } | null;
  contract?: {
    id: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    primaryMember?: { full_name?: string; name?: string } | null;
    primary_member?: { full_name?: string; name?: string } | null;
  } | null;
  confirmedBy?: { id: string; name: string } | null;
  items?: HandoverItem[];
  meter_snapshots?: HandoverSnapshot[];
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
      const response = await apiClient.get('/handovers', {
        params: {
          ...filters,
          include: 'room,room.property,contract,contract.primaryMember,confirmedBy',
        },
      });
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

  const updateHandover = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Handover> }) => {
      const response = await apiClient.patch(`/handovers/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
      queryClient.invalidateQueries({ queryKey: ['handover', id] });
    }
  });

  return {
    useHandovers,
    useHandoverDetails,
    createHandover,
    updateHandover,
    confirmHandover,
    addItem,
    addSnapshot
  };
}
