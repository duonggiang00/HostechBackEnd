# Tiêu chuẩn thiết kế & Kết nối API (API Standards)

Tài liệu này hướng dẫn cách frontend tương tác với API backend đúng chuẩn.

## 1. Document API (Scramble)
Truy cập `/docs/api` trên backend để xem tài liệu tự động. Frontend dev cần chú ý các Attribute `#[Group]` để tìm đúng module.

## 2. Query Parameters chuẩn
Mọi endpoint danh sách (Index) hỗ trợ các tham số chuẩn sau:

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `per_page` | int | Số lượng mục/trang. Mặc định: 15. |
| `page` | int | Số trang cần lấy. |
| `search` | string | Tìm kiếm theo từ khóa. |
| `sort` | string | Sắp xếp trường (VD: `-created_at` cho giảm dần). |
| `filter[xxx]` | mixed | Lọc theo trường `xxx`. |
| `with_trashed` | boolean | Lấy cả dữ liệu đã xóa mềm. |

## 3. Cấu trúc Response
Backend trả về dữ liệu qua **JSON Resources**:
- Dữ liệu chính nằm trong `data`.
- Phân trang nằm trong `links` và `meta`.
- Các quan hệ (relations) chỉ có khi frontend yêu cầu qua `include` hoặc backend tự động load.

## 4. Xử lý Lỗi (Error Handling)
- **422 Unprocessable Entity:** Lỗi validation (backend trả về mảng `errors`).
- **401 Unauthorized:** Mất phiên đăng nhập (Frontend cần redirect về `/auth/login`).
- **403 Forbidden:** Không có quyền truy cập.
- **404 Not Found:** Không tìm thấy tài nguyên.
- **500 Internal Server Error:** Lỗi hệ thống backend.
