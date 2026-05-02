import apiClient from '@/shared/api/client';
import type {
  Payment,
  PaginatedPayments,
  PaginatedLedger,
  PaginatedRefundReceipts,
  PaginatedCashflowFeed,
  PaginatedOutstandingInvoices,
  LedgerBalance,
  LedgerFinancialSummary,
  PaymentQueryParams,
  LedgerQueryParams,
  LedgerSummaryParams,
  RefundReceiptQueryParams,
  RefundReceiptRow,
  MarkRefundPaidPayload,
  CashflowFeedQueryParams,
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

  /**
   * Chi tiết 1 phiếu hoàn cọc (kèm pdf_url nếu đã sinh).
   * GET /api/finance/refund-receipts/{id}
   */
  getRefundReceipt: async (id: string): Promise<RefundReceiptRow> => {
    const response = await apiClient.get(`/finance/refund-receipts/${id}`);
    return response.data.data as RefundReceiptRow;
  },

  /**
   * BQL xác nhận đã chi hoàn cọc → set deposit_status = REFUNDED + sinh PDF.
   * POST /api/finance/refund-receipts/{id}/mark-paid
   */
  markRefundPaid: async (id: string, payload: MarkRefundPaidPayload): Promise<RefundReceiptRow> => {
    const response = await apiClient.post(`/finance/refund-receipts/${id}/mark-paid`, payload);
    return response.data.data as RefundReceiptRow;
  },

  /**
   * Dòng tiền thực tế hợp nhất (Payment IN + RefundReceipt OUT) — phục vụ tab "Dòng tiền tất cả".
   * GET /api/finance/cashflow-feed
   */
  getCashflowFeed: async (params?: CashflowFeedQueryParams): Promise<PaginatedCashflowFeed> => {
    const response = await apiClient.get('/finance/cashflow-feed', { params });
    return response.data as PaginatedCashflowFeed;
  },

  /**
   * Hóa đơn còn nợ (outstanding > 0, status không PAID/CANCELLED) — tab "Tiền nợ".
   * GET /api/properties/{propertyId}/invoices?filter[has_outstanding]=1
   */
  getOutstandingInvoices: async (
    propertyId: string,
    params?: { page?: number; per_page?: number; sort?: string },
  ): Promise<PaginatedOutstandingInvoices> => {
    const response = await apiClient.get(`/properties/${propertyId}/invoices`, {
      params: {
        ...params,
        'filter[has_outstanding]': 1,
        sort: params?.sort ?? '-due_date',
      },
    });
    return response.data as PaginatedOutstandingInvoices;
  },
};
