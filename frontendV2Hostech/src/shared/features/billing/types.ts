export interface TieredRate {
  id: string;
  tier_from: number;
  tier_to: number | null;
  price: number;
}

export interface ServiceRate {
  id: string;
  service_id: string;
  effective_from: string;
  price: number;
  tiered_rates?: TieredRate[];
}

export interface Service {
  id: string;
  code: string;
  name: string;
  type: 'ELECTRIC' | 'WATER' | 'OTHER';
  calc_mode: 'fixed' | 'metered' | 'tiered' | 'per_tenant';
  unit: string;
  is_recurring: boolean;
  is_active: boolean;
  current_price: number;
  rates?: ServiceRate[];
  meta?: any;
}

export interface InvoiceItem {
  id?: string;
  type?: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  unit_price?: number;
  total: number;
  amount?: number;
  meta?: any;
}

export interface Invoice {
  id: string;
  code: string;
  org_id?: string;
  property_id?: string | null;
  room_id?: string | null;
  contract_id?: string | null;
  invoice_date: string | null;
  issue_date?: string | null;
  due_date: string | null;
  period_start?: string | null;
  period_end?: string | null;
  status: 'DRAFT' | 'ISSUED' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL';
  /** Tổng trước thuế (alias UI / normalize từ API) */
  subtotal?: number;
  tax?: number;
  /** Tổng phải thu (alias của total_amount khi cần tách dòng) */
  total?: number;
  total_amount: number;
  paid_amount: number;
  debt: number;
  pdf_url?: string | null;
  notes: string | null;
  items?: InvoiceItem[];
  tenant?: {
    id?: string;
    name: string;
    room?: string;
    address?: string;
  };
  property?: {
    id?: string;
    name?: string;
    address?: string;
    phone?: string;
  };
  room?: {
    id?: string;
    code?: string;
    name?: string;
  };
  contract?: {
    id: string;
    status?: string;
  };
}

export interface InvoiceAdjustment {
  id: string;
  type: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
  approved_at?: string;
}

export interface VnpayPaymentAllocation {
  invoice_id: string;
  amount: number;
}

export interface VnpayCreatePaymentPayload {
  org_id: string;
  property_id?: string | null;
  payer_user_id?: string | null;
  method: 'QR' | 'WALLET';
  amount: number;
  bank_code?: string;
  note?: string | null;
  allocations: VnpayPaymentAllocation[];
  meta?: Record<string, any>;
}

export interface VnpayCreatePaymentResponse {
  message: string;
  payment_url: string;
  data: {
    id: string;
    status: string;
    method: string;
    amount: number;
  };
}

export interface VnpayVerifyResponse {
  payment_id: string;
  status: string;
  provider_status: string | null;
  provider_ref?: string | null;
  amount: number;
  success: boolean;
  data?: any;
}

// ── Payment types (matching PaymentResource) ───────────────────────────────

export interface PaymentReceipt {
  id: string;
  url: string;
  path: string;
}

export interface PaymentAllocationItem {
  id: string;
  payment_id: string;
  invoice_id: string;
  amount: number;
  invoice?: Pick<Invoice, 'id' | 'code' | 'status' | 'total_amount' | 'paid_amount'>;
}

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'QR' | 'WALLET';

export interface Payment {
  id: string;
  org_id: string;
  property_id: string | null;
  payer_user_id: string | null;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  note: string | null;
  meta: Record<string, any> | null;
  receipt?: PaymentReceipt | null;
  allocations?: PaymentAllocationItem[];
  payer?: { id: string; name: string; email?: string } | null;
  property?: { id: string; name: string } | null;
  received_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitPaymentProofPayload {
  invoice_id: string;
  method: 'CASH' | 'BANK_TRANSFER';
  amount: number;
  reference?: string;
  note?: string;
  proof_image?: File;
}

export interface PaymentVerificationResponse {
  message: string;
  data: Payment;
}
