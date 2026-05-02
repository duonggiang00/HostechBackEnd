// ─── Enums ────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOIDED';
/** Chuẩn: CASH | BANK_TRANSFER | VNPAY — TRANSFER/WALLET/QR là legacy hoặc tương thích. */
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'TRANSFER' | 'WALLET' | 'QR';

// ─── Sub-models ───────────────────────────────────────────────────────────────

export interface PaymentActor {
  id: string;
  full_name: string;
  email?: string;
}

export interface PaymentInvoiceRef {
  id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: string;
}

export interface PaymentAllocation {
  id: string;
  invoice_id: string;
  amount: number;
  invoice?: PaymentInvoiceRef;
  /** API legacy flat fields — dùng fallback khi chưa có nested `invoice` */
  invoice_status?: string | null;
}

export interface PaymentReceiptFile {
  id: string;
  kind: string;
  url: string;
  path: string;
}

// ─── Main Models ──────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  status: PaymentStatus;
  method: PaymentMethod;
  /** API trả sẵn nhãn tiếng Việt (song song với `method` mã). */
  method_label?: string;
  amount: number;
  reference: string | null;
  note: string | null;

  // Relations
  property: { id: string; name: string } | null;
  payer: PaymentActor | null;
  received_by: PaymentActor | null;
  approved_by: PaymentActor | null;
  allocations: PaymentAllocation[];
  receipt?: PaymentReceiptFile | null;
  proof_receipt?: PaymentReceiptFile | null;

  // Timestamps
  received_at: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  ref_type: string;
  ref_id: string;
  debit: number;
  credit: number;
  net: number;
  meta: Record<string, any> | null;
  occurred_at: string;
  created_at: string;
}

export interface LedgerBalance {
  total_debit: number;
  total_credit: number;
  net_balance: number;
}

/**
 * GET /finance/ledger/summary — KPI thu / hoàn quỹ + cọc đang giữ.
 *
 * `total_refunded` = SUM `RefundReceipt.amount` đã chi (paid_at IS NOT NULL) — match tab "Tiền hoàn trả".
 * `total_deposit_held` = SUM `deposit_amount` của HĐ đang ACTIVE (HĐ kết thúc → tự trừ).
 * `total_payment_reversal` (compat) = SUM credit `payment_reversal` (void Payment thường).
 */
export interface LedgerFinancialSummary {
  total_collected: number;
  total_refunded: number;
  total_payment_reversal?: number;
  total_deposit_held: number;
  period: { from: string | null; to: string | null };
  property_id: string | null;
}

export interface LedgerSummaryParams {
  'filter[property_id]'?: string;
  'filter[occurred_between]'?: string;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface VoidPaymentPayload {
  reason?: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface PaymentQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
  'filter[status]'?: PaymentStatus;
  'filter[method]'?: PaymentMethod;
  'filter[property_id]'?: string;
  'filter[received_between]'?: string; // "YYYY-MM-DD,YYYY-MM-DD"
  sort?: string;
}

export interface LedgerQueryParams {
  per_page?: number;
  page?: number;
  'filter[ref_type]'?: string;
  'filter[ref_id]'?: string;
  'filter[property_id]'?: string;
  'filter[occurred_between]'?: string;
  /** cashflow = chỉ dòng tiền thực (CASH_BANK); full = toàn bộ bút kép */
  'filter[view]'?: 'cashflow' | 'full';
  sort?: string;
}

export interface RefundReceiptRow {
  id: string;
  amount: number;
  reference: string | null;
  contract_id: string;
  property_id: string | null;
  room_id: string | null;
  room_name: string | null;
  room_code: string | null;
  property_name: string | null;
  /** Tên khách thuê (primary member) — phục vụ cột "Trả cho khách" tab Hoàn trả. */
  tenant_name: string | null;
  deposit_status: string | null;
  refunded_amount: number | null;
  meta: Record<string, unknown> | null;
  paid_at: string | null;
  payout_method: 'CASH' | 'TRANSFER' | null;
  payout_reference: string | null;
  paid_by_user: { id: string; full_name: string | null } | null;
  pdf_url: string | null;
  created_at: string;
}

export interface MarkRefundPaidPayload {
  paid_at?: string;
  payout_method: 'CASH' | 'TRANSFER';
  payout_reference?: string;
}

export interface RefundReceiptQueryParams {
  per_page?: number;
  page?: number;
  'filter[property_id]'?: string;
  'filter[contract_id]'?: string;
  'filter[created_between]'?: string;
  'filter[paid_only]'?: 0 | 1 | boolean;
}

/** GET /finance/cashflow-feed — 1 row = 1 giao dịch tiền thực (IN/OUT). */
export interface CashflowFeedRow {
  id: string;
  direction: 'IN' | 'OUT';
  kind: 'payment' | 'refund_receipt';
  reference: string | null;
  amount: number;
  occurred_at: string;
  actor_user_id: string | null;
  contract_id: string | null;
}

export interface CashflowFeedQueryParams {
  per_page?: number;
  page?: number;
  'filter[property_id]'?: string;
  'filter[occurred_between]'?: string;
  'filter[direction]'?: 'IN' | 'OUT';
}

export interface PaginatedCashflowFeed {
  data: CashflowFeedRow[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/** Row dành cho tab "Tiền nợ" — invoice còn outstanding. */
export interface OutstandingInvoiceRow {
  id: string;
  contract_id: string | null;
  status: string;
  due_date: string | null;
  total_amount: number;
  paid_amount: number;
  debt: number;
  tenant_name: string | null;
  room?: { id?: string; name?: string; code?: string } | null;
  contract?: { id?: string; status?: string } | null;
}

export interface PaginatedOutstandingInvoices {
  data: OutstandingInvoiceRow[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface PaginatedRefundReceipts {
  data: RefundReceiptRow[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Paginated Response ───────────────────────────────────────────────────────

export interface PaginatedPayments {
  data: Payment[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface PaginatedLedger {
  data: LedgerEntry[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
