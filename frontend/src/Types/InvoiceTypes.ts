import { z } from "zod";
import type { Property, Room, ContractMember, ContractUser } from "./ContractTypes";

// ───── Enums ─────
export const InvoiceStatus = {
    DRAFT: "DRAFT",
    ISSUED: "ISSUED",
    PAID: "PAID",
    PARTIAL: "PARTIAL",
    OVERDUE: "OVERDUE",
    CANCELLED: "CANCELLED",
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
    DRAFT: "Nháp",
    ISSUED: "Đã phát hành",
    PAID: "Đã thanh toán",
    PARTIAL: "Thanh toán một phần",
    OVERDUE: "Quá hạn",
    CANCELLED: "Đã huỷ",
};

export const InvoiceStatusColors: Record<InvoiceStatus, string> = {
    DRAFT: "default",
    ISSUED: "blue",
    PAID: "green",
    PARTIAL: "orange",
    OVERDUE: "red",
    CANCELLED: "red",
};

// ───── Invoice Item ─────
export interface InvoiceItem {
    id: string;
    type: string;       // Ví dụ: "rent", "service", "other"
    service_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;     // quantity * unit_price
    meta: string;
    created_at: string;
}

// ───── Invoice Contract (phần nhúng trong hóa đơn) ─────
export interface InvoiceContract {
    id: string;
    org_id: string;
    status: string;
    property: Property;
    room: Room;
    members: ContractMember[];
    start_date: string;
    end_date: string;
    rent_price: number;
    deposit_amount: number;
    billing_cycle: string;
    due_day: string;
    cutoff_day: string;
    join_code: string;
    join_code_expires_at: string;
    created_by: ContractUser;
    created_at: string;
    updated_at: string;
}

// ───── Invoice ─────
export interface Invoice {
    id: string;
    org_id: string;
    status: InvoiceStatus;
    period_start: string;
    period_end: string;
    issue_date: string;
    due_date: string;
    total_amount: number;
    paid_amount: number;
    debt: number;
    property: Property;
    room: Room;
    contract: InvoiceContract;
    items: InvoiceItem[];
    created_by: ContractUser;
    issued_by: ContractUser | null;
    issued_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

// ───── Zod Schemas ─────
export const InvoiceFormSchema = z.object({
    contract_id: z.string().min(1, "Vui lòng chọn hợp đồng"),
    period_start: z.string().min(1, "Vui lòng chọn ngày bắt đầu kỳ"),
    period_end: z.string().min(1, "Vui lòng chọn ngày kết thúc kỳ"),
    issue_date: z.string().min(1, "Vui lòng chọn ngày phát hành"),
    due_date: z.string().min(1, "Vui lòng chọn hạn thanh toán"),
    status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.DRAFT),
});
export type InvoiceFormValues = z.infer<typeof InvoiceFormSchema>;

export const InvoiceItemSchema = z.object({
    type: z.string().min(1, "Vui lòng chọn loại chi phí"),
    service_id: z.string().default(""),
    description: z.string().min(1, "Vui lòng nhập mô tả"),
    quantity: z.number().min(1, "Số lượng phải >= 1"),
    unit_price: z.number().min(0, "Đơn giá không được âm"),
});
export type InvoiceItemFormValues = z.infer<typeof InvoiceItemSchema>;
