import type { RoomContract } from '@/PropertyScope/features/contracts/types';
import type { Invoice } from '../billing/types';


export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'reserved' | 'draft';


export interface RoomAsset {
  id?: string;
  name: string;
  condition?: string;
  serial?: string;
}

export interface RoomImage {
  id?: string;
  url: string;
  thumb_url?: string;
}

export interface RoomReading {
  id: string;
  meter_id: string;
  reading_value: number;
  reading_date: string;
  consumption?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface RoomMeter {
  id: string;
  code: string;
  type: 'ELECTRIC' | 'WATER' | string;
  last_reading?: number;
  last_reading_date?: string;
  installed_at?: string;
  is_active?: boolean;
  readings?: RoomReading[];
}

export interface RoomFloor {
  id: string;
  name: string;
  floor_number?: number;
}

export interface RoomProperty {
  id: string;
  name: string;
}

export interface RoomFloorPlanNode {
  floor_id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  rotation?: number;
}

export interface PricePeriod {
  id: string;
  room_id: string;
  price: number;
  start_date: string;
  end_date: string | null;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'scheduled' | 'expired';
}

export interface RoomAdjustment {
  id: string;
  room_id: string;
  type: 'increase' | 'decrease';
  amount: number;
  reason: string;
  created_at: string;
}

export interface RoomStatusHistory {
  id: string;
  from_status: RoomStatus;
  to_status: RoomStatus;
  notes?: string;
  actor_name?: string;
  created_at: string;
}


export interface Room {
  id: string;
  property_id: string;
  floor_id: string | null;
  code: string;
  name: string;
  area: number;
  capacity: number;
  base_price: number;
  status: RoomStatus;
  description: string | null;
  property_name?: string;
  floor_name?: string;
  property?: RoomProperty;
  floor?: RoomFloor;
  contracts?: RoomContract[];
  active_contract?: RoomContract | null;
  meters?: RoomMeter[];
  assets?: RoomAsset[];
  price_histories?: PriceHistory[];
  status_histories?: RoomStatusHistory[];
  invoices?: Invoice[];
  images?: RoomImage[];
  room_services?: Array<{
    id: string;
    quantity: number;
    service?: {
      id: string;
      name: string;
      current_price: number;
      unit: string;
      calc_mode: string;
    };
  }>;
  floor_plan_node?: RoomFloorPlanNode | null;
  deleted_at?: string | null;
  // UI consistency helpers
  _x?: number;
  _y?: number;
  _width?: number;
  _height?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PriceHistory {
  id: string;
  price: number;
  start_date: string;
  created_at?: string;
}

export interface RoomQueryParams {
  property_id?: string;
  floor_id?: string;
  status?: RoomStatus;
  search?: string;
  code?: string;
  include?: string;
  sort?: string;
  with_trashed?: boolean;
  page?: number;
  per_page?: number;
  // Advanced Filters
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  capacity_min?: number;
  capacity_max?: number;
}

export interface CreateRoomPayload {
  property_id: string;
  floor_id?: string;
  code: string;
  name: string;
  area: number;
  capacity: number;
  base_price?: number;
  description?: string;
  media_ids?: string[];
  service_ids?: string[];
}
export interface RoomTemplateAsset {
  id?: string;
  name: string;
}

export interface RoomTemplateMeter {
  id?: string;
  type: 'ELECTRIC' | 'WATER';
}

export interface RoomTemplate {
  id: string;
  property_id: string;
  name: string;
  area: number;
  capacity: number;
  base_price: number;
  description: string | null;
  amenities: string[] | null;
  utilities: string[] | null;
  assets?: RoomTemplateAsset[];
  meters?: RoomTemplateMeter[];
  services?: any[]; // Typically shared service models
  created_at: string;
  updated_at: string;
}

export interface CreateRoomFromTemplatePayload {
  template_id: string;
  name: string;
  code: string;
  floor_id?: string;
  floor_number?: number;
}
