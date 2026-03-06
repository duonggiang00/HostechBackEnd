export interface RoomDetail {
  name: string;
  floor_id: { id: number; name: string };
  zone_id: { id: number; name: string };
  status: number;
}

export interface RoomPhoto {
  id: number;
  room_id: number;
  photo_url: string;
  photo_name: string;
  description?: string;
  created_at?: string;
}

export interface RoomPrice {
  id: number;
  room_id: number;
  price: number;
  currency: string;
  price_type: string;
  effective_date: string;
  is_active: boolean;
}
