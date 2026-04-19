import type { RoomStatus } from '@/PropertyScope/features/rooms/types';

// ─── API Response Types ───────────────────────────────────────────────────────

export interface RoomGridLayout {
  column: number;   // x — column_index
  row: number;      // y — row_index
  col_span: number; // width — columns occupied
  row_span: number; // height — rows occupied
}

export interface BuildingRoom {
  id: string;
  code: string;
  name?: string;
  status: RoomStatus;
  area?: number;
  base_price?: number;
  floor_id?: string;
  layout: RoomGridLayout;
  // Local-only fields (set during Edit Mode)
  temp_id?: string;
  template_id?: string;
  isDraft?: boolean;  // true = chưa lưu xuống DB
}

export interface BuildingFloor {
  id: string;
  name: string;
  floor_number: number;
  rooms: BuildingRoom[];
  // Local-only
  temp_id?: string;
  isDraft?: boolean;
}

export interface RoomTemplateOption {
  id: string;
  name: string;
  area?: number;
  base_price?: number;
  room_type?: string;
}

export interface BuildingOverviewResponse {
  id: string;
  name: string;
  code?: string;
  floors: BuildingFloor[];
  templates: RoomTemplateOption[];
}

// ─── Sync Payload Types ───────────────────────────────────────────────────────

export interface SyncRoomEntry {
  id?: string;       // uuid — phòng cũ
  temp_id?: string;  // string tạm — phòng mới
  code?: string;
  template_id?: string;
  x: number;         // column_index
  y?: number;        // row_index (default 0)
  width?: number;    // col_span
  height?: number;   // row_span
}

export interface SyncFloorEntry {
  floor_id?: string; // uuid — tầng cũ
  temp_id?: string;  // string tạm — tầng mới
  name?: string;
  floor_number?: number;
  rooms: SyncRoomEntry[];
}

export interface SyncBuildingOverviewPayload {
  template_id?: string;         // template dùng cho TẤT CẢ phòng mới (nếu không override riêng)
  sync_data: SyncFloorEntry[];
  deleted_room_ids?: string[];
  deleted_floor_ids?: string[];
}
