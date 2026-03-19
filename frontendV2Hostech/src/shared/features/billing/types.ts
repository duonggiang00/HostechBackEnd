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
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  code: string;
  invoice_date: string;
  due_date: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  tax: number;
  total: number;
  paid_amount: number;
  notes: string | null;
  items?: InvoiceItem[];
  tenant?: {
    name: string;
    room?: string;
    address?: string;
  };
  property?: {
    name: string;
    address?: string;
    phone?: string;
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
