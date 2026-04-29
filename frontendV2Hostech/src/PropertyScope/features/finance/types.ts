// ─── Enums ────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOIDED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'TRANSFER' | 'WALLET' | 'QR';

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

/** GET /finance/ledger/summary — thu/hoàn quỹ + cọc đang giữ (không phải lợi nhuận). */
export interface LedgerFinancialSummary {
  total_collected: number;
  total_refunded: number;
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
  contract_id: string;
  property_id: string | null;
  room_id: string | null;
  room_name: string | null;
  property_name: string | null;
  deposit_status: string | null;
  refunded_amount: number | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface RefundReceiptQueryParams {
  per_page?: number;
  page?: number;
  'filter[property_id]'?: string;
  'filter[created_between]'?: string;
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
