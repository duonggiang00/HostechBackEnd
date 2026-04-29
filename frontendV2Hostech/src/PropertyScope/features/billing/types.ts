// ─── Enums ────────────────────────────────────────────────────────────────────

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PENDING'
  | 'PAID'
  | 'PARTIAL'
  | 'OVERDUE'
  | 'CANCELLED';

export type InvoiceItemType =
  | 'RENT'
  | 'SERVICE'
  | 'ADJUSTMENT'
  | 'DEBT'
  | 'PENALTY'
  | 'DEPOSIT'
  | 'DISCOUNT'
  | 'OTHER';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'FAILED' | 'CANCELLED';

export type PaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'E_WALLET' | 'CREDIT_CARD';

// ─── Sub-models ───────────────────────────────────────────────────────────────

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  type: InvoiceItemType;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  meta?: Record<string, any> | null;
}

export interface InvoiceStatusHistory {
  id: string;
  invoice_id: string;
  from_status: InvoiceStatus | null;
  to_status: InvoiceStatus;
  note: string | null;
  changed_by?: InvoiceUser;
  created_at: string;
}

export interface InvoiceUser {
  id: string;
  full_name: string;
  email?: string;
  phone?: string | null;
  avatar?: string | null;
}

export interface InvoiceAdjustment {
  id: string;
  invoice_id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  reason: string;
  is_approved: boolean;
  created_by?: InvoiceUser;
  approved_by?: InvoiceUser;
  approved_at?: string;
  created_at: string;
}

export interface InvoiceRoom {
  id: string;
  name: string;
  code: string;
}

export interface InvoiceProperty {
  id: string;
  name: string;
}

export interface PaymentAllocation {
  id: string;
  invoice_id: string;
  amount: number;
  invoice?: Invoice; // Eager-loaded relation from backend
  invoice_code?: string;
  invoice_status?: InvoiceStatus;
  invoice_total?: number;
  created_at: string;
}

export interface Payment {
  id: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  note: string | null;
  received_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  property?: InvoiceProperty;
  payer?: InvoiceUser;
  received_by?: InvoiceUser;
  approved_by?: InvoiceUser;
  allocations?: PaymentAllocation[];
}

// ─── Main Model ───────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  org_id: string;
  property_id: string;
  room_id: string | null;
  contract_id: string | null;
  status: InvoiceStatus;

  // Kỳ thanh toán
  period_start: string;
  period_end: string;
  issue_date: string | null;
  due_date: string | null;

  // Tài chính
  total_amount: number;
  paid_amount: number;
  debt: number;

  // Flags
  is_termination?: boolean;

  // Relationships (eager loaded)
  property?: InvoiceProperty;
  room?: InvoiceRoom;
  contract?: any; // Replace with Contract type if available
  items?: InvoiceItem[];
  status_histories?: InvoiceStatusHistory[];
  adjustments?: InvoiceAdjustment[];
  created_by?: InvoiceUser;
  issued_by?: InvoiceUser | null;

  // PDF
  pdf_url?: string | null;

  // Timestamps
  issued_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface GenerateMonthlyPayload {
  billing_date?: string;
}

export interface IssueInvoicePayload {
  note?: string;
}

export interface RecordPaymentPayload {
  amount: number;
  method: string;
  reference?: string;
  received_at?: string;
  note?: string;
  payer_user_id?: string;
}

export interface CancelInvoicePayload {
  note?: string;
}

export interface CreateInvoiceItemPayload {
  type: InvoiceItemType;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  service_id?: string;
  meta?: Record<string, any>;
}

export interface CreateInvoicePayload {
  property_id: string;
  room_id?: string;
  contract_id?: string;
  period_start: string;
  period_end: string;
  issue_date?: string;
  due_date?: string;
  status?: InvoiceStatus;
  items?: CreateInvoiceItemPayload[];
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface InvoiceQueryParams {
  property_id?: string;
  room_id?: string;
  status?: InvoiceStatus;
  is_termination?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

// ─── Paginated Response ───────────────────────────────────────────────────────

export interface PaginatedInvoices {
  data: Invoice[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
// ─── Shared Editor Types ───────────────────────────────────────────────────────

export interface TieredRate {
  tier_from: number;
  tier_to: number | null;
  price: number;
}

export interface EditableInvoiceItem extends CreateInvoiceItemPayload {
  id: string; // Temporary ID for frontend management
  meter_id?: string;
  prev_reading?: number;
  curr_reading?: number;
  is_metered?: boolean;
  meter_type?: 'ELECTRIC' | 'WATER';
  tiered_rates?: TieredRate[];
}
