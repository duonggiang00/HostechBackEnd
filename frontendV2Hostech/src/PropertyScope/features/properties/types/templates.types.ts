export interface RoomTemplateImage {
  uuid: string;
  url: string;
  thumb_url: string;
  name: string;
}

export interface RoomTemplate {
  id: string;
  property_id: string;
  name: string;
  room_type?: string;
  base_price: number;
  area?: number;
  capacity?: number;
  description?: string;
  services?: any[];
  assets?: any[];
  media?: Array<{
    id: string;
    original_url: string;
    preview_url?: string;
    name: string;
    size: number;
    mime_type: string;
  }>;
  images?: RoomTemplateImage[];
  cover_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomTemplatePayload {
  name: string;
  room_type?: string;
  base_price: number;
  area?: number;
  capacity?: number;
  description?: string;
  services?: string[];
  assets?: { name: string; condition: string; note: string; quantity: number }[];
  media_ids?: string[];
}

