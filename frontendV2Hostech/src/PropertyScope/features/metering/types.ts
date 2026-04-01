export interface Meter {
  id: string;
  property_id: string;
  room_id?: string;
  code: string;
  type: 'ELECTRIC' | 'WATER';
  is_active: boolean;
  is_master?: boolean;
  installed_at?: string;
  base_reading?: number;
  meta?: Record<string, any>;
  last_reading?: number;
  latest_reading?: number;
  last_read_at?: string;
  property_name?: string;
  room_name?: string;
  room?: { id: string; code: string; name: string; property?: { id: string; name: string } };
  created_at?: string;
  updated_at?: string;
}

export interface MeterReading {
  id: string;
  meter_id: string;
  reading_value: number;
  reading_date?: string;
  photo_url?: string;
  consumption?: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  // New fields from backend
  period_start?: string;
  period_end?: string;
  submitted_by_user_id?: string;
  submitted_at?: string;
  submitted_by?: { id: string; name: string };
  approved_by_user_id?: string;
  approved_at?: string;
  approved_by?: { id: string; name: string };
  rejection_reason?: string;
  rejected_by_user_id?: string;
  rejected_at?: string;
  rejected_by?: { id: string; name: string };
  locked_at?: string;
  meta?: Record<string, any>;
  proofs?: {
    id: string;
    url: string;
    thumb_url?: string;
    name?: string;
    file_name?: string;
    mime_type?: string;
    size?: number;
  }[];
  /** IDs từ temporary upload để gán ảnh khi tạo/cập nhật reading */
  proof_media_ids?: string[];
  created_at?: string;
  updated_at?: string;
}
