import type { Room, RoomStatus } from '@/PropertyScope/features/rooms/types';

export type { Room, RoomStatus };

export interface RoomPrimaryTenantSummary {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  phone?: string | null;
}

/** Bản ghi phòng được sử dụng trên bảng /org/rooms (mở rộng RoomResource bằng primary_tenant). */
export interface OrgRoomListItem extends Room {
  primary_tenant?: RoomPrimaryTenantSummary | null;
}

export interface OrgRoomListMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from?: number | null;
  to?: number | null;
}

export interface OrgRoomListResponse {
  data: OrgRoomListItem[];
  meta: OrgRoomListMeta;
}

export interface OrgRoomListParams {
  search?: string;
  status?: RoomStatus | '';
  property_id?: string;
  page?: number;
  per_page?: number;
  sort?: string;
}

/** Body cho PUT /rooms/:id từ Org Scope (subset trường room cho phép sửa nhanh). */
export interface OrgRoomUpdatePayload {
  name?: string;
  code?: string;
  base_price?: number;
  status?: RoomStatus;
  area?: number;
  capacity?: number;
  floor_id?: string | null;
  description?: string | null;
}
