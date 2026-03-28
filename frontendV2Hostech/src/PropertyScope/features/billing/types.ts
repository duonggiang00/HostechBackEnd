// ─── Enums ────────────────────────────────────────────────────────────────────

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type InvoiceItemType =
  | 'RENT'
  | 'ELECTRIC'
  | 'WATER'
  | 'SERVICE'
  | 'ADJUSTMENT'
  | 'OTHER';

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
  actor?: {
    id: string;
    full_name: string;
    email?: string;
  };
  created_at: string;
}

export interface InvoiceActor {
  id: string;
  full_name: string;
  email?: string;
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
  items?: InvoiceItem[];
  status_histories?: InvoiceStatusHistory[];
  created_by?: InvoiceActor;
  issued_by?: InvoiceActor | null;

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
