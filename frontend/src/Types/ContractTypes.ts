import { z } from "zod";

export const ContractStatus = {
    DRAFT: "DRAFT",
    PENDING_SIGNATURE: "PENDING_SIGNATURE",
    PENDING_PAYMENT: "PENDING_PAYMENT",
    ACTIVE: "ACTIVE",
    ENDED: "ENDED",
    CANCELLED: "CANCELLED",
} as const;
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

export const ContractStatusLabels: Record<ContractStatus, string> = {
    DRAFT: "Bản nháp",
    PENDING_SIGNATURE: "Chờ khách ký",
    PENDING_PAYMENT: "Chờ thanh toán",
    ACTIVE: "Đang hiệu lực",
    ENDED: "Đã kết thúc",
    CANCELLED: "Đã hủy",
};

export const ContractStatusColors: Record<ContractStatus, string> = {
    DRAFT: "default",
    PENDING_SIGNATURE: "processing",
    PENDING_PAYMENT: "warning",
    ACTIVE: "success",
    ENDED: "error",
    CANCELLED: "error",
};

export const ContractMemberStatus = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const;
export type ContractMemberStatus = (typeof ContractMemberStatus)[keyof typeof ContractMemberStatus];


// ───── Sub-types ─────
export interface Room {
    id: string;
    code: string;
    name: string;
    type: string;
    area: string;
    floor: string;
    capacity: string;
    base_price: string;
    status: string;
    description: string;
    amenities: string;
    utilities: string;
    created_at: string;
    updated_at: string;
}

export interface Floor {
    id: string;
    property_id: string;
    code: string;
    name: string;
    sort_order: string;
    rooms: Room[];
    created_at: string;
    updated_at: string;
}

export interface Property {
    id: string;
    code: string;
    name: string;
    address: string;
    note: string;
    use_floors: boolean;
    default_billing_cycle: string;
    default_due_day: string;
    default_cutoff_day: string;
    bank_accounts: string;
    floors: Floor[];
    rooms: Room[];
    created_at: string;
    updated_at: string;
}

export interface ContractUser {
    id: string;
    org_id: string;
    full_name: string;
    phone: string;
    email: string;
    email_verified_at: string | null;
    phone_verified_at: string | null;
    is_active: string;
    mfa_enabled: string;
    last_login_at: string | null;
    roles: string;
    permissions: string;
    created_at: string;
    updated_at: string;
}

export interface ContractMember {
    id: string;
    contract_id: string;
    user: ContractUser;
    role: string;
    is_primary: string;
    joined_at: string;
    left_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Contract {
    id: string;
    org_id: string;
    status: ContractStatus;
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
    deleted_at?: string | null; // Dùng cho soft delete
}

// ───── Zod Schema ─────
export const ContractMemberSchema = z.object({
    user_id: z.string().optional().nullable(),
    full_name: z.string().min(1, "Vui lòng nhập họ tên"),
    phone: z.string().min(10, "Số điện thoại không hợp lệ"),
    email: z.string().email("Email không hợp lệ").optional().or(z.literal('')),
    citizen_id: z.string().optional(),
    role: z.string().default("ROOMMATE"),
    is_primary: z.boolean().default(false),
});

export const ContractServiceSchema = z.object({
    service_id: z.string().min(1, "Vui lòng chọn dịch vụ"),
    custom_price: z.number().optional().nullable(),
});

export const ContractFormSchema = z.object({
    property_id: z.string().min(1, "Vui lòng chọn toà nhà"),
    room_id: z.string().min(1, "Vui lòng chọn phòng"),
    start_date: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
    end_date: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
    rent_price: z.number().min(0, "Giá thuê không được âm"),
    deposit_amount: z.number().min(0, "Tiền đặt cọc không được âm"),
    billing_cycle: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY"),
    due_day: z.number().min(1).max(31).or(z.string().transform(Number)),
    cutoff_day: z.number().min(1).max(31).or(z.string().transform(Number)),
    status: z.nativeEnum(ContractStatus).default(ContractStatus.DRAFT),
    members: z.array(ContractMemberSchema).optional(),
    services: z.array(ContractServiceSchema).optional(),
});

export type ContractFormValues = z.infer<typeof ContractFormSchema>;
