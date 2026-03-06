/**
 * Types dùng chung toàn bộ frontend — Hostech
 */

/** Wrapper cho response phân trang từ Laravel */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

/** Wrapper cho response đơn từ Laravel */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Lỗi validation (HTTP 422) */
export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}

/** Params phân trang và tìm kiếm chung */
export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

/** Trạng thái loading chung */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}
