---
description: Mở rộng chức năng cho một module Frontend đã tồn tại (Extend an existing module)
---

# Extend Frontend Module Workflow

**Mục tiêu**: Triển khai logic, kết nối API và xây dựng UI chi tiết cho module sau khi đã qua bước scaffold.

**Các bước thực hiện**:
1. **API Integration**: Viết các client calls bằng thư viện Axios trong thư mục `api/` dựa vào API docs tài liệu Backend.
2. **State Management**: Viết custom hooks kết hợp React Query (`useQuery`, `useMutation`) trong thư mục `hooks/`.
3. **UI Components**: Xây dựng UI trong thư mục `components/` dùng Ant Design. 
4. **RBAC Logic**: Bọc tất cả các Component/nút bấm tạo, cập nhật, xóa (Create/Update/Delete) bằng Component bảo mật `<RequireRole allowedRoles={[...]}>`. Không được quên bước này ở bất kỳ form nào.
5. **Page Assembly**: Lắp ráp các hooks và components vào file `pages/`. Tích hợp route logic và xử lý thông báo lỗi.
