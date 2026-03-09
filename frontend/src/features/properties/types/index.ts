export interface OrgDTO {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  timezone: string;
  currency: string;
  properties_count: number;
  users_count: number;
  created_at: string;
  updated_at: string;
}

// Alias for backward compatibility
export type Org = OrgDTO;

export interface RoomDTO {
  id: string;
  code: string;
  name: string;
  type: string;
  area: string;
  capacity: string;
  base_price: string;
  status: string;
  floor_number: string;
  description: string;
  amenities: string;
  utilities: string;
  created_at: string;
  updated_at: string;

  // Relations
  floor?: FloorDTO;
  property?: PropertyDTO;
  assets?: string; // TBD if needed
  price_histories?: string;
  status_histories?: string;
  images?: string;
}

export interface FloorDTO {
  id: string;
  property_id: string;
  code: string;
  name: string;
  sort_order: string;
  created_at: string;
  updated_at: string;

  // Relations
  rooms?: RoomDTO[];
}

export interface PropertyDTO {
  id: string;
  code: string;
  name: string;
  address: string;
  note: string;
  use_floors: boolean;
  default_billing_cycle: string;
  default_due_day: string;
  default_cutoff_day: string;
  bank_accounts: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  org_id?: string;
  org?: OrgDTO;
  floors?: FloorDTO[];
  rooms?: RoomDTO[];
  floors_count?: number;
  rooms_count?: number;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}
