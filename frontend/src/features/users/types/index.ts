export interface UserType {
    id: string | number;
    full_name: string;
    email: string;
    phone?: string;
    identity_number?: string;
    roles: string[];
    is_active: boolean;
    properties?: Array<{ id: string; name: string }>;
    last_login_at?: string;
    created_at?: string;
}

export interface UserFilters {
    search?: string;
    'filter[role]'?: string;
    'filter[is_active]'?: boolean | undefined;
    'filter[property_id]'?: string;
    sort?: string;
    page?: number;
    per_page?: number;
}

export interface InvitationPayload {
    email: string;
    role: string;
    property_ids?: string[];
    note?: string;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}
