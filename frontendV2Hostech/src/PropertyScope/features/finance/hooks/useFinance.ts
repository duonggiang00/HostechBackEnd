import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';
import type { PaymentQueryParams, LedgerQueryParams, LedgerSummaryParams, RefundReceiptQueryParams } from '../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const financeKeys = {
  all: ['finance'] as const,
  payments: (params?: PaymentQueryParams) => ['finance', 'payments', params] as const,
  payment: (id: string) => ['finance', 'payment', id] as const,
  ledger: (params?: LedgerQueryParams) => ['finance', 'ledger', params] as const,
  balance: () => ['finance', 'ledger', 'balance'] as const,
  ledgerSummary: (params?: LedgerSummaryParams) => ['finance', 'ledger', 'summary', params] as const,
  refundReceipts: (params?: RefundReceiptQueryParams) => ['finance', 'refund-receipts', params] as const,
};

// ─── Payments Hooks ───────────────────────────────────────────────────────────

/**
 * Danh sách biên lai (phân trang + filter)
 */
export function usePayments(params?: PaymentQueryParams) {
  return useQuery({
    queryKey: financeKeys.payments(params),
    queryFn: () => financeApi.getPayments(params),
    staleTime: 30_000,
  });
}

/**
 * Chi tiết 1 biên lai
 */
export function usePayment(id: string | null) {
  return useQuery({
    queryKey: financeKeys.payment(id ?? ''),
    queryFn: () => financeApi.getPayment(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * Hủy biên lai — invalidate danh sách sau khi void thành công
 */
export function useVoidPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.voidPayment(id),
    onSuccess: () => {
      // Invalidate toàn bộ payments list để reload
      queryClient.invalidateQueries({ queryKey: ['finance', 'payments'] });
      // Invalidate invoices vì paid_amount đã thay đổi sau khi void
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'refund-receipts'] });
    },
  });
}

// ─── Ledger Hooks ─────────────────────────────────────────────────────────────

/**
 * Danh sách bút toán sổ cái
 */
export function useLedger(params?: LedgerQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: financeKeys.ledger(params),
    queryFn: () => financeApi.getLedger(params),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Số dư tổng hợp (tổng debit, credit, net) — kế toán kép; xem thêm useLedgerSummary cho KPI thu/hoàn/cọc.
 */
export function useLedgerBalance() {
  return useQuery({
    queryKey: financeKeys.balance(),
    queryFn: () => financeApi.getBalance(),
    staleTime: 60_000,
  });
}

/**
 * Tổng tiền thu quỹ, đã hoàn trả, cọc đang giữ (theo backend /ledger/summary).
 */
export function useLedgerSummary(params?: LedgerSummaryParams) {
  return useQuery({
    queryKey: financeKeys.ledgerSummary(params),
    queryFn: () => financeApi.getLedgerSummary(params),
    staleTime: 30_000,
  });
}

/**
 * Danh sách phiếu hoàn cọc (theo tòa / khoảng ngày)
 */
export function useRefundReceipts(params?: RefundReceiptQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: financeKeys.refundReceipts(params),
    queryFn: () => financeApi.getRefundReceipts(params),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}
