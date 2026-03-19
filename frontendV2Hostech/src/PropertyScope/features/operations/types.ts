export interface Asset {
  id: string;
  room_id: string;
  name: string;
  serial: string | null;
  condition: 'new' | 'good' | 'fair' | 'poor';
  purchased_at: string | null;
  warranty_end: string | null;
  note: string | null;
}
