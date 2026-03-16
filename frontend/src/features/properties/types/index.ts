// ─── Organization ───────────────────────────────────────────────
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

/** Alias for backward compatibility */
export type Org = OrgDTO;

// ─── Room Assets (from Stash — needed for Room edit page) ────────
export interface RoomAssetType {
  id?: string | number;
  room_id?: string | number;
  name: string;
  quantity?: number;
  status?: 'good' | 'damaged' | 'lost' | string;
  serial?: string;
  condition?: string;
  notes?: string;
  note?: string;
  purchased_at?: string;
  warranty_end?: string;
}

// ─── Room ────────────────────────────────────────────────────────
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
  assets?: RoomAssetType[];
  price_histories?: any[];
  status_histories?: any[];
  images?: Array<{ id: string; url: string; thumb?: string }>;
}

// ─── Floor ───────────────────────────────────────────────────────
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
  rooms_count?: number;
  vacant_rooms_count?: number;
  occupied_rooms_count?: number;
}

// ─── Property ────────────────────────────────────────────────────
export interface PropertyDTO {
  id: string;
  code: string;
  name: string;
  address: string;
  area: number;
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

// ─── Pagination ──────────────────────────────────────────────────
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

// ─── Type aliases for backward compatibility with Stash code ─────
export type PropertyType = PropertyDTO;
export type FloorType = FloorDTO;
export type RoomType = RoomDTO;
