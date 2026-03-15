import { z } from "zod";

// ───── Enums ─────
export const MeterTypeLabels: Record<string, string> = {
  electricity: "Điện",
  water: "Nước",
  gas: "Gas",
  other: "Khác",
};

export const MeterStatusLabels: Record<string | number, string> = {
  1: "Đang hoạt động",
  0: "Ngừng hoạt động",
};

// ───── Meter ─────
export interface Meter {
  id: string;
  name: string;
  meter_number: string;
  meter_type: string;
  status: number;
  room_id: string;
  room?: {
    id: string;
    name: string;
    code: string;
  };
  property?: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

// ───── Reading ─────
export interface MeterReading {
  id: string;
  meter_id: string;
  reading_value: number;
  reading_date: string;
  previous_reading?: number;
  consumption?: number;
  unit_price?: number;
  total_amount?: number;
  note?: string;
  created_by?: { id: string; full_name: string };
  created_at: string;
  updated_at: string;
}

// ───── Adjustment ─────
export interface MeterAdjustment {
  id: string;
  reading_id: string;
  reason: string;
  adjusted_value: number;
  status: string; // pending, approved, rejected
  approved_by?: { id: string; full_name: string };
  created_at: string;
}

// ───── Zod Schemas ─────
export const MeterFormSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên đồng hồ"),
  meter_number: z.string().min(1, "Vui lòng nhập số đồng hồ"),
  meter_type: z.string().min(1, "Vui lòng chọn loại đồng hồ"),
  room_id: z.string().min(1, "Vui lòng chọn phòng"),
  status: z.number().default(1),
});
export type MeterFormValues = z.infer<typeof MeterFormSchema>;

export const MeterReadingForm = z.object({
  reading_value: z.number().min(0, "Chỉ số phải >= 0"),
  reading_date: z.string().min(1, "Vui lòng chọn ngày đọc"),
  note: z.string().default(""),
});
export type MeterReadingFormValues = z.infer<typeof MeterReadingForm>;

// ───── Filters ─────
export interface MeterFilters {
  property_id?: string;
  room_id?: string;
  meter_type?: string;
  status?: string;
  sort?: string;
  include?: string;
  per_page?: number;
  page?: number;
}
