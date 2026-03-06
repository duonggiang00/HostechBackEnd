import { z } from "zod";

// ───── Enums ─────
export const ContractStatus = {
    DRAFT: "DRAFT",
    ACTIVE: "ACTIVE",
    EXPIRED: "EXPIRED",
    TERMINATED: "TERMINATED",
} as const;
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

export const ContractStatusLabels: Record<ContractStatus, string> = {
    DRAFT: "Nháp",
    ACTIVE: "Đang hiệu lực",
    EXPIRED: "Hết hạn",
    TERMINATED: "Đã chấm dứt",
};

export const ContractStatusColors: Record<ContractStatus, string> = {
    DRAFT: "default",
    ACTIVE: "green",
    EXPIRED: "orange",
    TERMINATED: "red",
};

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
export const ContractFormSchema = z.object({
    room_id: z.string().min(1, "Vui lòng chọn phòng"),
    primary_user_id: z.string().min(1, "Vui lòng chọn người thuê chính"),
    start_date: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
    end_date: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
    rent_price: z.number().min(0, "Giá thuê không được âm"),
    deposit_amount: z.number().min(0, "Tiền đặt cọc không được âm"),
    billing_cycle: z.string().min(1, "Vui lòng chọn kỳ thanh toán"),
    due_day: z.string().min(1, "Vui lòng nhập ngày đến hạn"),
    cutoff_day: z.string().min(1, "Vui lòng nhập ngày chốt"),
    status: z.nativeEnum(ContractStatus).default(ContractStatus.DRAFT),
});

export type ContractFormValues = z.infer<typeof ContractFormSchema>;
