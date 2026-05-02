import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';

export interface HandoverItemApi {
  id: string;
  handover_id?: string;
  room_asset_id?: string | null;
  name: string;
  condition: 'OK' | 'MISSING' | 'DAMAGED' | string;
  note?: string | null;
  sort_order?: number;
  condition_photo_urls?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Biên lai hoàn cọc gắn với contract của handover. Mirror của `RefundReceiptResource` ở BE.
 * Chỉ expose những trường UI handover thực sự dùng — không kéo nguyên type finance để giảm coupling.
 */
export interface HandoverRefundReceipt {
  id: string;
  amount: number;
  reference: string | null;
  contract_id: string;
  room_name?: string | null;
  room_code?: string | null;
  property_name?: string | null;
  deposit_status?: string | null;
  refunded_amount?: number | null;
  meta?: Record<string, unknown> | null;
  paid_at: string | null;
  payout_method: string | null;
  payout_reference: string | null;
  paid_by_user: { id: string; full_name?: string | null } | null;
  pdf_url: string | null;
  created_at: string | null;
}

export interface Handover {
  id: string;
  org_id: string;
  contract_id: string | null;
  room_id: string | null;
  created_by_user_id?: string | null;
  note: string | null;
  document_scan_urls?: string[];
  created_at: string;
  updated_at: string;
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
    property_id?: string | null;
    /** ContractResource: thành viên đầu (khách thuê) khi load `members`. */
    tenant?: { id?: string; name?: string; full_name?: string; email?: string } | null;
    primaryMember?: { full_name?: string; name?: string } | null;
    primary_member?: { full_name?: string; name?: string } | null;
  } | null;
  createdBy?: { id: string; full_name?: string; name?: string } | null;
  items?: HandoverItemApi[];
  meter_snapshots?: HandoverSnapshot[];
  /**
   * Biên lai hoàn cọc mới nhất theo `contract_id` (BE: HandoverResource embed `latest_refund_receipt`).
   * `null` khi HĐ chưa phát sinh hoàn cọc; đã có nhưng `paid_at = null` ⇔ đang chờ BQL chi tiền.
   */
  refund_receipt?: HandoverRefundReceipt | null;
}

/** Payload index GET /handovers (Laravel resource collection). */
export interface HandoversIndexResponse {
  data: Handover[];
}

export interface HandoverSnapshot {
  id?: string;
  handover_id?: string;
  meter_id?: string;
  meter_type?: string;
  reading_value: number | string;
  reading_date?: string;
  unit?: string;
  meter_photo_urls?: string[];
  meter?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export function useHandover() {
  const queryClient = useQueryClient();

  const useHandovers = (
    filters?: Record<string, unknown>,
    options?: Pick<
      UseQueryOptions<HandoversIndexResponse, Error, HandoversIndexResponse>,
      'enabled' | 'staleTime' | 'gcTime'
    >,
  ) =>
    useQuery<HandoversIndexResponse>({
      queryKey: ['handovers', filters],
      queryFn: async () => {
        const response = await apiClient.get<HandoversIndexResponse>('/handovers', {
          params: {
            ...filters,
            include: 'room,room.property,contract,contract.primaryMember,createdBy',
          },
        });
        return response.data;
      },
      ...options,
    });

  const useHandoverDetails = (id: string) =>
    useQuery({
      queryKey: ['handover', id],
      queryFn: async () => {
        const response = await apiClient.get(`/handovers/${id}`);
        return response.data.data as Handover;
      },
      enabled: !!id,
    });

  const createHandover = useMutation({
    mutationFn: async (data: Partial<Pick<Handover, 'contract_id' | 'room_id' | 'note'>>) => {
      const response = await apiClient.post('/handovers', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
    },
  });

  const addItem = useMutation({
    mutationFn: async ({ handoverId, data }: { handoverId: string; data: Record<string, unknown> }) => {
      const response = await apiClient.post(`/handovers/${handoverId}/items`, data);
      return response.data.data;
    },
    onSuccess: (_, { handoverId }) => {
      queryClient.invalidateQueries({ queryKey: ['handover', handoverId] });
    },
  });

  const addSnapshot = useMutation({
    mutationFn: async ({ handoverId, data }: { handoverId: string; data: Record<string, unknown> }) => {
      const response = await apiClient.post(`/handovers/${handoverId}/snapshots`, data);
      return response.data.data;
    },
    onSuccess: (_, { handoverId }) => {
      queryClient.invalidateQueries({ queryKey: ['handover', handoverId] });
    },
  });

  const updateHandover = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Pick<Handover, 'note'>> }) => {
      const response = await apiClient.patch(`/handovers/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
      queryClient.invalidateQueries({ queryKey: ['handover', id] });
    },
  });

  return {
    useHandovers,
    useHandoverDetails,
    createHandover,
    updateHandover,
    addItem,
    addSnapshot,
  };
}
