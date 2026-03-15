---
description: Tự động hóa việc tạo cấu trúc thư mục và file khởi điểm cho một module Frontend mới (Feature-based)
---

# Scaffold Frontend Module Workflow

**Mục tiêu**: Khởi tạo cấu trúc thư mục chuẩn cho một feature Frontend mới tại `frontend/src/features/[module_name]`.

**Các bước thực hiện**:
1. Tạo thư mục feature mới: `frontend/src/features/[module_name]`.
2. Tạo các thư mục con bên trong: `api`, `components`, `hooks`, `pages`, `stores`, `types`.
3. Tạo file `index.ts` để export public API của module (nếu cần).
4. Tạo file `routes.tsx` định nghĩa các route cơ bản.
5. Khai báo route mới vào `frontend/src/app/routes/registry.ts`.
6. Định nghĩa các interface/type tĩnh ban đầu tại `types/index.ts` dựa trên Backend API.
7. **API Architecture Note**: Đảm bảo Backend API sử dụng **Flat Routes** (vd: `/rooms?filter[floor_id]=x`) thay vì Nested Routes (vd: `/floors/x/rooms`).
8. Tạo một trang Page trống đơn giản (vd: Dashboard.tsx) để đảm bảo trình duyệt hiển thị đúng đường dẫn không bị lỗi 404.
