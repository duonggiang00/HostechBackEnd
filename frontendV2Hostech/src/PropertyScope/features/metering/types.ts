export interface Meter {
  id: string;
  property_id: string;
  room_id?: string;
  code: string;
  type: 'ELECTRIC' | 'WATER';
  is_active: boolean;
  last_reading?: number;
  last_reading_date?: string;
  room?: { id: string; name: string; property?: { id: string; name: string } };
}

export interface MeterReading {
  id: string;
  meter_id: string;
  reading_value: number;
  reading_date: string;
  photo_url?: string;
  consumption?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
