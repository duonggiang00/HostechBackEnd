import { z } from "zod";

export const ServiceCalcMode = {
    PER_PERSON: "PER_PERSON",
    PER_ROOM: "PER_ROOM",
    QUANTITY: "QUANTITY", // Theo số lượng
    PER_METER: "PER_METER", // Theo công tơ (Điện/Nước)
} as const;

export type ServiceCalcMode = (typeof ServiceCalcMode)[keyof typeof ServiceCalcMode];

export const ServiceCalcModeLabels: Record<ServiceCalcMode, string> = {
    [ServiceCalcMode.PER_PERSON]: "Theo đầu người",
    [ServiceCalcMode.PER_ROOM]: "Theo phòng",
    [ServiceCalcMode.QUANTITY]: "Theo số lượng",
    [ServiceCalcMode.PER_METER]: "Theo chỉ số đồng hồ",
};

export interface Service {
    id: string;
    org_id: string;
    code: string;
    name: string;
    calc_mode: ServiceCalcMode;
    unit: string;
    is_recurring: boolean; // Có tính định kỳ hàng tháng không
    is_active: boolean;
    price?: number; // Tùy chọn vì giá có thể nằm trong bảng giá riêng, nhưng đơn giản hóa cho danh sách UI
    current_rate?: ServiceRate;
}

export interface ServiceRate {
    id: string;
    service_id: string;
    effective_from: string; // Năm-Tháng-Ngày
    price: number;
}

// Zod Schemas
export const ServiceFormSchema = z.object({
    code: z.string().min(1, "Mã dịch vụ là bắt buộc"),
    name: z.string().min(1, "Tên dịch vụ là bắt buộc"),
    calc_mode: z.nativeEnum(ServiceCalcMode),
    unit: z.string().min(1, "Đơn vị tính là bắt buộc"),
    price: z.number().min(0, "Đơn giá không được âm"),
    is_recurring: z.boolean().default(true),
    is_active: z.boolean().default(true),
});

export type ServiceFormValues = z.infer<typeof ServiceFormSchema>;
