import apiClient from '@/shared/api/client';
import type {
  Payment,
  PaginatedPayments,
  PaginatedLedger,
  PaginatedRefundReceipts,
  LedgerBalance,
  LedgerFinancialSummary,
  PaymentQueryParams,
  LedgerQueryParams,
  LedgerSummaryParams,
  RefundReceiptQueryParams,
} from '../types';

export const financeApi = {
  // ─── Payments ──────────────────────────────────────────────────────────

  /**
   * Danh sách biên lai (có filter, phân trang)
   * GET /api/finance/payments
   */
  getPayments: async (params?: PaymentQueryParams): Promise<PaginatedPayments> => {
    const response = await apiClient.get('/finance/payments', { params });
    return response.data as PaginatedPayments;
  },

  /**
   * Chi tiết 1 biên lai (kèm allocations)
   * GET /api/finance/payments/{id}
   */
  getPayment: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/finance/payments/${id}`, {
      params: { include: 'payer,receivedBy,approvedBy,allocations.invoice,property' },
    });
    return response.data.data as Payment;
  },

  /**
   * Hủy biên lai (void) — hoàn tác gạch nợ trên hóa đơn
   * DELETE /api/finance/payments/{id}
   */
  voidPayment: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/finance/payments/${id}`);
    return response.data;
  },

  // ─── Ledger (Sổ cái) ───────────────────────────────────────────────────

  /**
   * Danh sách bút toán sổ cái
   * GET /api/finance/ledger
   */
  getLedger: async (params?: LedgerQueryParams): Promise<PaginatedLedger> => {
    const response = await apiClient.get('/finance/ledger', { params });
    return response.data as PaginatedLedger;
  },

  /**
   * Số dư tổng hợp sổ cái (toàn org — không filter theo tòa).
   * KPI theo tòa: dùng {@link financeApi.getLedgerSummary} hoặc {@link financeApi.getLedger} với `filter[property_id]`.
   * GET /api/finance/ledger/balance
   */
  getBalance: async (): Promise<LedgerBalance> => {
    const response = await apiClient.get('/finance/ledger/balance');
    return response.data.data as LedgerBalance;
  },

  /**
   * Tổng hợp thu / hoàn (quỹ) + cọc đang giữ
   * GET /api/finance/ledger/summary
   */
  getLedgerSummary: async (params?: LedgerSummaryParams): Promise<LedgerFinancialSummary> => {
    const response = await apiClient.get('/finance/ledger/summary', { params });
    return response.data.data as LedgerFinancialSummary;
  },

  /**
   * Phiếu hoàn cọc (sau thanh lý hợp đồng)
   * GET /api/finance/refund-receipts
   */
  getRefundReceipts: async (params?: RefundReceiptQueryParams): Promise<PaginatedRefundReceipts> => {
    const response = await apiClient.get('/finance/refund-receipts', { params });
    return response.data as PaginatedRefundReceipts;
  },
};
