import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';

export interface TenantRefundReceipt {
  id: string;
  amount: number;
  reference: string | null;
  contract_id: string;
  property_id: string | null;
  property_name: string | null;
  room_id: string | null;
  room_name: string | null;
  room_code: string | null;
  deposit_status: string | null;
  payout_method: 'CASH' | 'TRANSFER' | null;
  payout_reference: string | null;
  paid_at: string | null;
  paid_by_user: { id: string; full_name: string | null } | null;
  pdf_url: string | null;
  created_at: string;
  meta: Record<string, unknown> | null;
}

export interface TenantRefundReceiptList {
  data: TenantRefundReceipt[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page?: number;
  };
}

export const TENANT_REFUND_RECEIPTS_QUERY_KEY = 'tenant-refund-receipts';

/**
 * Danh sách biên lai hoàn cọc của Tenant (chỉ phiếu đã có PDF).
 */
export function useTenantRefundReceipts(filters?: { page?: number; per_page?: number }) {
  return useQuery<TenantRefundReceiptList>({
    queryKey: [TENANT_REFUND_RECEIPTS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.per_page) params.set('per_page', String(filters.per_page));
      const res = await apiClient.get(`/app/refund-receipts?${params}`);
      return res.data as TenantRefundReceiptList;
    },
    staleTime: 30_000,
  });
}
