export interface TieredRate {
  id?: string;
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
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  org_id: string;
  code: string;
  name: string;
  calc_mode: 'PER_ROOM' | 'PER_PERSON' | 'PER_QUANTITY' | 'PER_METER';
  unit: string;
  is_recurring: boolean;
  is_active: boolean;
  current_price: number; // dynamically computed in backend
  rates?: ServiceRate[];
  created_at: string;
  updated_at: string;
}

export interface ServiceFormData {
  code: string;
  name: string;
  calc_mode: 'PER_ROOM' | 'PER_PERSON' | 'PER_QUANTITY' | 'PER_METER';
  unit: string;
  is_recurring: boolean;
  is_active: boolean;
  price: number;
  effective_from?: string;
  tiered_rates?: TieredRate[];
}

export interface PaginatedServiceResponse {
  data: Service[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
