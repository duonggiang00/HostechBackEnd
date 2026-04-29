import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import type {
  Payment,
  SubmitPaymentProofPayload,
  PaymentVerificationResponse,
} from '@/shared/features/billing/types';
import { CONTRACT_KEY, MY_CONTRACTS_KEY } from '@/PropertyScope/features/contracts/hooks/useContracts';

export const TENANT_PAYMENTS_QUERY_KEY = 'tenant-payments';
export const PAYMENT_VERIFICATIONS_QUERY_KEY = 'payment-verifications';

// ── Tenant Hooks ──────────────────────────────────────────────────────────────

/**
 * Lấy danh sách payment của Tenant hiện tại (kể cả PENDING).
 */
export function useTenantPayments(filters?: { page?: number; per_page?: number }) {
  return useQuery<{ data: Payment[]; meta?: any }>({
    queryKey: [TENANT_PAYMENTS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.per_page) params.set('per_page', String(filters.per_page));
      const res = await apiClient.get(`/app/payments?${params}`);
      return res.data;
    },
  });
}

/**
 * Gửi bằng chứng thanh toán (Tenant).
 * Sử dụng multipart/form-data để upload ảnh.
 */
export function useSubmitPaymentProof() {
  const queryClient = useQueryClient();

  return useMutation<PaymentVerificationResponse, unknown, SubmitPaymentProofPayload>({
    mutationFn: async (payload) => {
      const form = new FormData();
      form.append('invoice_id', payload.invoice_id);
      form.append('method', payload.method);
      form.append('amount', String(payload.amount));
      if (payload.reference) form.append('reference', payload.reference);
      if (payload.note) form.append('note', payload.note);
      if (payload.proof_image) form.append('proof_image', payload.proof_image);

      const res = await apiClient.post('/app/payments/submit-proof', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TENANT_PAYMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_CONTRACTS_KEY] });
    },
  });
}

// ── Manager Verification Hooks ────────────────────────────────────────────────

/**
 * Lấy danh sách Payment PENDING cần xét duyệt (Manager/Staff).
 */
type PendingPaymentsData = { data: Payment[]; meta?: any };

export function usePendingPayments(
  filters?: { property_id?: string; page?: number; per_page?: number },
  queryOptions?: Omit<UseQueryOptions<PendingPaymentsData, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<PendingPaymentsData>({
    queryKey: [PAYMENT_VERIFICATIONS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.property_id) params.set('property_id', filters.property_id);
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.per_page) params.set('per_page', String(filters.per_page ?? 20));
      const res = await apiClient.get(`/finance/payment-verifications?${params}`);
      return res.data;
    },
    ...queryOptions,
  });
}

/**
 * Duyệt bằng chứng thanh toán (Manager/Staff có quyền theo backend).
 */
export function useApprovePayment() {
  const queryClient = useQueryClient();

  return useMutation<PaymentVerificationResponse, unknown, { id: string; note?: string }>({
    mutationFn: async ({ id, note }) => {
      const res = await apiClient.post(`/finance/payment-verifications/${id}/approve`, { note });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYMENT_VERIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    },
  });
}

/**
 * Từ chối bằng chứng thanh toán (Manager).
 */
export function useRejectPayment() {
  const queryClient = useQueryClient();

  return useMutation<PaymentVerificationResponse, unknown, { id: string; reason: string }>({
    mutationFn: async ({ id, reason }) => {
      const res = await apiClient.post(`/finance/payment-verifications/${id}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYMENT_VERIFICATIONS_QUERY_KEY] });
    },
  });
}
