export interface Floor {
  id: string;
  property_id: string;
  code: string;
  name: string;
  floor_number: number;
  sort_order?: number;
  area?: number;
  shared_area?: number;
  floor_plan_image?: string | null;
  rooms_count?: number;
  vacant_rooms_count?: number;
  occupied_rooms_count?: number;
}
