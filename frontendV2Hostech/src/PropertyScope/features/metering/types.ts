export interface Meter {
  id: string;
  property_id: string;
  room_id?: string;
  code: string;
  type: 'ELECTRIC' | 'WATER';
  is_active: boolean;
  is_master?: boolean;
  installed_at?: string;
  
  base_reading: number;
  latest_reading: number;
  consumption?: number;
  last_read_at?: string;
  
  meta?: Record<string, any>;
  
  property_name?: string;
  room_name?: string;
  room?: { id: string; code: string; name: string; property?: { id: string; name: string } };
  created_at?: string;
  updated_at?: string;
}

export type MeterReadingStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'LOCKED';
export type AdjustmentNoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdjustmentNote {
  id: string;
  meter_reading_id: string;
  reason: string;
  before_value: number;
  after_value: number;
  status: AdjustmentNoteStatus;
  requested_by?: { id: string; name: string; email?: string };
  approved_by?: { id: string; name: string; email?: string };
  approved_at?: string;
  rejected_by?: { id: string; name: string; email?: string };
  rejected_at?: string;
  reject_reason?: string;
  proofs?: { id: string; url: string; name?: string; file_name?: string; mime_type?: string; size?: number }[];
  created_at?: string;
}

export interface MeterReading {
  id: string;
  meter_id: string;
  reading_value: number;
  reading_date?: string;
  photo_url?: string;
  consumption?: number;
  status: MeterReadingStatus;
  // Period fields
  period_start?: string;
  period_end?: string;
  // Submission tracking
  submitted_by_user_id?: string;
  submitted_at?: string;
  submitted_by?: { id: string; full_name: string; email?: string };
  // Approval tracking
  approved_by_user_id?: string;
  approved_at?: string;
  approved_by?: { id: string; full_name: string; email?: string };
  // Lock tracking
  locked_at?: string;
  // Metadata
  meta?: Record<string, any>;
  // Media proofs from server
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
  // Adjustment notes (loaded on demand)
  adjustments?: AdjustmentNote[];
  // Relations
  meter?: Meter;
  created_at?: string;
  updated_at?: string;
}
