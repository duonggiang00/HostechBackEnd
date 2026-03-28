import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/billing';
import type {
  Invoice,
  InvoiceQueryParams,
  GenerateMonthlyPayload,
  IssueInvoicePayload,
  RecordPaymentPayload,
  CancelInvoicePayload,
} from '../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const invoiceKeys = {
  all: ['invoices'] as const,
  byProperty: (propertyId: string, filters?: InvoiceQueryParams) =>
    ['invoices', 'property', propertyId, filters] as const,
  detail: (id: string) => ['invoices', id] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách hóa đơn theo Property, hỗ trợ lọc và phân trang
 */
export function usePropertyInvoices(propertyId: string, params?: InvoiceQueryParams) {
  return useQuery({
    queryKey: invoiceKeys.byProperty(propertyId, params),
    queryFn: () => billingApi.getPropertyInvoices(propertyId, params),
    enabled: !!propertyId,
    staleTime: 30_000,
  });
}

/**
 * Chi tiết hóa đơn (bao gồm items, statusHistories, relations)
 */
export function useInvoiceDetail(id: string | null) {
  return useQuery({
    queryKey: invoiceKeys.detail(id ?? ''),
    queryFn: () => billingApi.getInvoice(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * Phát hành hóa đơn hàng tháng cho cả Property
 */
export function useGenerateMonthly(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: GenerateMonthlyPayload) =>
      billingApi.generateMonthly(propertyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'property', propertyId] });
    },
  });
}

/**
 * Phát hành 1 hóa đơn (DRAFT → ISSUED)
 */
export function useIssueInvoice(propertyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: IssueInvoicePayload }) =>
      billingApi.issueInvoice(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      if (propertyId) {
        queryClient.invalidateQueries({ queryKey: ['invoices', 'property', propertyId] });
      } else {
        queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      }
    },
  });
}

/**
 * Ghi nhận thanh toán
 */
export function useRecordPayment(propertyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RecordPaymentPayload }) =>
      billingApi.recordPayment(id, payload),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      if (propertyId) {
        queryClient.invalidateQueries({ queryKey: ['invoices', 'property', propertyId] });
      } else {
        queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      }
    },
  });
}

/**
 * Hủy hóa đơn
 */
export function useCancelInvoice(propertyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: CancelInvoicePayload }) =>
      billingApi.cancelInvoice(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      if (propertyId) {
        queryClient.invalidateQueries({ queryKey: ['invoices', 'property', propertyId] });
      } else {
        queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      }
    },
  });
}
