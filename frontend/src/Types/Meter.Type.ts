export interface MeterForm {
  name: string;
  room_id?: string;
  meter_type?: string;
  meter_number?: string;
}

export interface FormErrors {
  name?: string;
  room_id?: string;
  meter_type?: string;
  meter_number?: string;
  general?: string;
}

export interface MeterDetail {
  name: string;
  room_id: { id: number; name: string };
  meter_type: string;
  meter_number: string;
  status: number;
}
