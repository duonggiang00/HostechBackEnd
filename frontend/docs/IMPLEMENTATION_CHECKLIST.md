# IMPLEMENTATION CHECKLIST — Hostech Frontend

> Cập nhật lần cuối: 2026-03-06


Tài liệu này theo dõi tiến trình triển khai giao diện Frontend dựa trên các specs và API từ Backend.

---

## 🚀 Phase 1: Foundation & Security (Setup Core)

- [ ] Cài đặt khung Router (React Router v7) và cấu hình Nested Routes.
- [ ] Cấu hình Axios Interceptor (tự động gắn Bearer Token, làm mới token, bắt lỗi 401 redirect).
- [ ] Cấu hình React Query Client (Cache Time, Stale Time, Retry logic).
- [ ] Khởi tạo Zustand AppStore (Quản lý Theme, Sidebar state, current User/Role/Tenant ID).
- [ ] Layout Component chính: `MainLayout` (Dành cho người dùng đã đăng nhập) và `AuthLayout` (Cho trang Login/Register).

### Auth & Profile Module (Sanctum/Fortify)
- [ ] Giao diện Đăng nhập (Login) + Gọi API Sanctum lấy Token.
- [ ] Giao diện Quên mật khẩu / Đặt lại mật khẩu.
- [ ] Phân quyền bảo vệ Route (`ProtectedRoute` / `RequireRole`).
- [ ] Giao diện Hồ sơ cá nhân (Profile): Cập nhật thông tin, Upload ảnh đại diện (avatar).
- [ ] Tích hợp bảo mật 2FA (TOTP verification).

---

## 🏢 Phase 2: Professional Infrastructure & RBAC (Current)

### Architectural Shift (Semantic Routing)
- [x] Phân tách không gian Quản lý (`/manage`) và Cổng thông tin (`/me`). ✅ **Done (Phase D1)**
- [x] Triển khai `usePermission` hook và `<RequireRole />` component. ✅ **Done**
- [x] Tự động điều hướng (Redirect) theo vai trò tại trang chủ `/`. ✅ **Done**

### Zero-Mock Integration (Đồng bộ Backend)
- [x] Thay thế toàn bộ Mock Data bằng API thực tế (Properties, Floors, Rooms). ✅ **Done**
- [x] Triển khai CRUD thực tế (bao gồm nút Xóa với Soft Delete UI). ✅ **Done**
- [x] `useDebounce` + API-connected Search cho Properties/Floors/Rooms. ✅ **Done**
- [ ] Tích hợp `spatie/laravel-query-builder` filter nâng cao (status, property filter).

### Property & Room Module (Quản lý tòa nhà/phòng)
- [x] Danh sách Tòa nhà (Property) với CRUD + Soft Delete Trash Modal. ✅ **Done**
- [x] Floors và Rooms với CRUD + API search + Trash/Restore. ✅ **Done**
- [ ] Chi tiết Tòa nhà -> Cấu trúc Tầng (Floor) -> Phòng (Room).
- [ ] Giao diện chi tiết Phòng (Room Detail) hiển thị tình trạng thuê, hợp đồng.
- [ ] Quản lý tài sản trong phòng (RoomAsset CRUD).


---

## 💸 Phase 3: Core Operations (Vận hành & Kinh doanh)

### Service Module (Dịch vụ)
- [ ] Danh sách dịch vụ tiện ích chung (Service CRUD).
- [ ] Gắn/Tháo dịch vụ trên từng phòng cụ thể (Room Service).

### Contract Module (Hợp đồng thuê)
- [ ] **Giao diện Manager:** 
   - [ ] Tạo hợp đồng mới (Draft -> Active).
   - [ ] Thêm người dùng (Khách thuê) vào hợp đồng.
   - [ ] Hủy/Kết thúc hợp đồng (Termination).
- [ ] **Giao diện Tenant:** 
   - [ ] Danh sách hợp đồng đang chờ ký (Pending Contracts).
   - [ ] Xác nhận / Từ chối hợp đồng.
   - [ ] Chức năng `Self-Service`: Thêm/Mời Roommate.
   - [ ] Xin chuyển phòng (Room Transfer Request).

### Meter & Invoice Module (Điện nước & Hóa đơn)
- [ ] Màn hình Ghi chỉ số điện nước (MeterReading) hàng tháng (Giao diện Spreadsheet/Table nhập nhanh theo dạng lưới).
- [ ] Xem chi tiết chênh lệch sử dụng.
- [ ] Màn hình duyệt Phiếu điều chỉnh (Adjustment Notes).
- [ ] Danh sách Hóa đơn (Invoices): Hiển thị trạng thái DRAFT / SENT / PAID.
- [ ] Chi tiết Hóa đơn (Nội dung chi phí, tổng tiền).
- [ ] Ghi nhận thanh toán (Payment Tracking/Logging).

---

## 🛠️ Phase 4: Support & Extra (Hỗ trợ & Bàn giao)

### Ticket Module (Hỗ trợ/Phàn nàn)
- [ ] Màn hình tạo Ticket (Dành cho Tenant) kèm Upload ảnh minh họa.
- [ ] Bảng điều khiển Quản lý Ticket (Kanban Board hoặc Table cho Staff/Manager) (OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED).
- [ ] Chức năng Trao đổi / Bình luận trong Ticket (TicketComment).
- [ ] Quản lý chi phí sửa chữa/hỗ trợ (TicketCost).

### Handover Module (Bàn giao)
- [ ] Danh sách phiếu bàn giao (HandoverRecords) khi khách vào/ra phòng.
- [ ] Giao diện xác nhận tình trạng vật tư phòng (HandoverItems) đính kèm danh sách ảnh minh họa hỏng hóc/tốt.

---

## 📊 Phase 5: Dashboard & Notifications

- [ ] Biểu đồ thống kê Tỷ lệ lấp đầy phòng (Occupancy Rate).
- [ ] Báo cáo Doanh thu Hóa đơn.
- [ ] Tích hợp chuông thông báo Realtime (WebSockets/SSE) cho Ticket mới, Hóa đơn mới.
