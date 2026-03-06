// Types dùng chung cho toàn bộ frontend

/**
 * Wrapper cho response phân trang từ Laravel
 */
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
}

/**
 * Wrapper cho response đơn từ Laravel
 */
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

/**
 * Lỗi validation từ backend (HTTP 422)
 */
export interface ValidationError {
    message: string;
    errors: Record<string, string[]>;
}

/**
 * Params phân trang chung
 */
export interface PaginationParams {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: string;
    sort_dir?: "asc" | "desc";
}
