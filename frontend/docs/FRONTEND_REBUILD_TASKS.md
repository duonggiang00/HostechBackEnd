# Frontend Rebuild Execution Tasks

> Checklist chi tiết (Micro-tasks) theo dõi tiến độ đập đi xây lại toàn bộ Frontend nhằm đảm bảo 100% đồng bộ với Backend APIs và tuân thủ Kiến trúc Multi-Space & RBAC.

## Phase 1: Core Foundation & Shared Services (Week 1)

### 1.1 Multi-Space Routing & Auth Rebuild
- [~] Dọn dẹp/Xóa thư mục logic Auth cũ. (Skipped)
- [~] Xây dựng Layouts: `LayoutAuth`, `LayoutManage`, `LayoutPortal`, `LayoutSysAdmin`. (Skipped)
- [~] Xây dựng trang Đăng nhập / Đăng ký (Gắn với Fortify). (Skipped)
- [~] Cấu hình Axios Interceptors (Sanctum Tokens). (Skipped)
- [~] Cấu hình Zustand `AuthStore` (Lưu thông tin User & Roles). (Skipped)
- [~] Route Guard `<ProtectedRoute>` và Component Guard `<RequireRole>`. (Skipped)
- [x] Tích hợp TOTP 2FA UI (Sử dụng endpoint `/api/user/two-factor-authentication`).
- [x] UI Cập nhật thông tin cá nhân (Tên, SĐT, CCCD).
- [x] Móc API POST `/api/profile/avatar` cho Profile.
- [x] Bổ sung chức năng Đăng xuất (Logout) gọi API `POST /api/auth/logout` và cleanup Zustand Store cho LayoutAuth / LayoutPortal.
- [ ] **Mandatory Audit 1.1**: Kiểm tra bảo mật Route + test rò rỉ JWT.

### 1.2 Org & User Management
- [x] Scaffold module `users` & `organizations`.
- [x] State Context của Org (Cho phép Owner/Manager chuyển Org nếu thuộc nhiều Org).
- [x] UI Tạo/Sửa Tổ chức (`POST /api/orgs`).
- [x] Danh sách nhân viên & người dùng (`GET /api/users`).
- [x] Chức năng gửi Lời mời (Invitations) kèm gán Role (Manager / Staff / Tenant).
- [x] **Mandatory Audit 1.2**: Test Permission của Spatie RBAC có khóa chính xác UI không. Tách bạch hiển thị Tenant và Staff.

### 1.3 System, Audit & Media Hub
- [x] Scaffold module `system`.
- [x] Xây dựng Component tái sử dụng `<MediaUploader />` (gọi `POST /api/media/upload`).
- [x] Xây dựng trang Audit Logs (`/manage/audit-logs`) hiển thị bảng từ `GET /api/audit-logs`.
- [x] Hỗ trợ xem JSON diff (old vs attributes) cho Audit Logs.
- [x] Xây dựng luồng xác thực token lời mời (Invitations) tại `/invite/:token`.
- [x] **Mandatory Audit 1.3**: Kiểm tra tính độc lập và tái sử dụng form media, block API Audit Logs cho Manager/Staff.

---

## Phase 2: Operations & Hierarchy (Week 2)

### 2.1 Property, Floor & Room Assets
- [x] Scaffold module `properties`.
- [x] Bảng định tuyến Tòa nhà (`GET /api/properties`).
- [x] Cấu trúc hiển thị phân cấp (Accordion/Tabs) cho Tầng (Floors) thuộc Tòa nhà.
- [x] Bảng quản lý Phòng (Rooms) thuộc Tầng.
- [x] UI Form Tạo/Sửa Tòa Nhà, Tầng, Phòng (Tích hợp `MediaUploader` để tải lên ảnh Tòa nhà, ảnh Phòng).
- [x] Chuyển đổi toàn bộ Modal box sang Route Pages cho Tòa Nhà, Tầng, Phòng.
- [x] UI Quản lý tài sản trong phòng (`RoomAsset` CRUD).
- [x] **Mandatory Audit 2.2**: Rà soát performance của Nested Tables (có N+1 render ở React không), verify các query keys của React Query đã tối ưu cache chưa.

### 2.3 Services Catalog
- [ ] Scaffold module `services`.
- [ ] Bảng danh mục Dịch vụ (`GET /api/services`).
- [ ] Form Tạo/Sửa Dịch vụ mặc định.
- [ ] Xây dựng component `<RoomServiceAssigner />` để gắn dịch vụ vào Phòng.
- [ ] Giao diện thay đổi giá dịch vụ riêng (`custom_price`) cho mỗi phòng.
- [ ] **Mandatory Audit 2.3**: Check React Hook Form FormArray validation.

---

## Phase 3: Core Business Workflows (Week 3)

### 3.1 Contracts (Admin & Tenant Portal)
- [ ] **Step 1: `/scaffold_frontend_module`**
    - [ ] Khởi tạo thư mục `contracts` cấu trúc chuẩn.
    - [ ] Khai báo route `/manage/contracts` và `/me/contracts`.
- [ ] **Step 2: `/extend_frontend_module`**
    - [ ] **Management Space**: Danh sách Hợp đồng (Filters: DRAFT/ACTIVE/ENDED), Form tạo Hợp đồng bước-qua-bước (Chọn phòng -> Nhập Tenant -> Cấu hình chu kỳ/cọc -> Tải file/ảnh scan Hợp đồng bằng `MediaUploader` -> Lưu DRAFT), Bảng `ContractMembers` (Phê duyệt APPROVED/REJECTED), Luồng Thanh lý hợp đồng sớm (`Terminate Contract`). Đề cao `<RequireRole>`.
    - [ ] **Tenant Space**: View Hợp đồng chờ ký (`GET /my-pending`), Nút Accept Signature gửi OTP/Ký hoặc Nút Reject. Chi tiết hợp đồng (Ẩn mã `join_code` nếu pending).
    - [ ] **Tenant Self-Service**: Form xin chuyển phòng (`room-transfer-request`) sử dụng API tìm phòng trống. Form mời người ở ghép (`POST /contracts/members`) dành riêng cho Tenant có trạng thái APPROVED.
- [ ] **Step 3: `/audit_frontend_module` (Mandatory)**
    - [ ] TypeScript Check & React Hooks review.
    - [ ] Test luồng block Tenant nếu chưa có hợp đồng Active.
    - [ ] Kiểm tra và cập nhật Sidebar Links (Contracts). Manual testing 4 accounts.

### 3.2 Invoices & Adjustments
- [ ] **Step 1: `/scaffold_frontend_module`**
    - [ ] Khởi tạo thư mục `invoices`.
    - [ ] Khai báo route `/manage/invoices` và `/me/invoices`.
- [ ] **Step 2: `/extend_frontend_module`**
    - [ ] **Management Space**: Danh sách Hóa đơn theo tòa nhà/trạng thái, Logic chuyển `DRAFT -> SENT`, Invoice Builder (Thêm/Sửa/Xóa `InvoiceItems` khi hóa đơn chưa gửi), Quản lý `Invoice Adjustments` (Phiếu chiết khấu/Phụ phí).
    - [ ] **Tenant Space**: Page xem hóa đơn chi tiết của phòng mình (Chỉ hiện hóa đơn SENT/PAID). Hiện QR Code thanh toán nếu có. Nút tải PDF hóa đơn.
- [ ] **Step 3: `/audit_frontend_module` (Mandatory)**
    - [ ] TypeScript Check & React Query Optimization.
    - [ ] Debug logic tổng tiền tại Client (Đảm bảo giá trị `amount` * `quantity` khớp 100% API).
    - [ ] Kiểm tra và cập nhật Sidebar Links (Invoices). Test Roles.

---

## Phase 4: Facilities & Issue Tracking (Week 4)

### 4.1 Meters & Utility Processing
- [ ] **Step 1: `/scaffold_frontend_module`**
    - [ ] Khởi tạo thư mục `meters`.
    - [ ] Khai báo route quản lý điện nước.
- [ ] **Step 2: `/extend_frontend_module`**
    - [ ] **Management Space**: Xây dựng Excel-like Grid nhập chỉ số nhanh cho Tòa Nhà (Cho phép đính kèm ảnh chụp đồng hồ qua tĩnh `MediaUploader`), Phê duyệt Điều chỉnh Chỉ số (Meter Adjustments).
- [ ] **Step 3: `/audit_frontend_module` (Mandatory)**
    - [ ] TypeScript Check.
    - [ ] Check debounce update tránh spam server khi gõ Excel Grid.
    - [ ] Kiểm tra và cập nhật Sidebar Links (Meters). Test Roles.

### 4.2 Tickets (Incident Management)
- [ ] **Step 1: `/scaffold_frontend_module`**
    - [ ] Khởi tạo thư mục `tickets`.
- [ ] **Step 2: `/extend_frontend_module`**
    - [ ] **Management Space**: Bảng Kanban kéo thả trạng thái sự cố (OPEN -> RECEIVED -> IN_PROGRESS -> WAITING_PARTS -> DONE/CANCELLED). Logic tự lưu `closed_at`.
    - [ ] **Management Space**: Component Chat/Timeline hiển thị các `TicketEvent`. Thiết kế form nhập Chi phí sửa chữa (`TicketCost`) đính kèm người chịu tiền (Payer). Đảm bảo `<RequireRole>`.
    - [ ] **Tenant Space**: Form báo sự cố `POST /api/tickets` bắt buộc đính kèm Ảnh/Video qua `<MediaUploader />`.
    - [ ] **Tenant Space**: Trang theo dõi tiến độ sự cố (Timeline). Khung Chat cho phép Tenant chủ động thêm Binh luận (Event type `COMMENT`).
- [ ] **Step 3: `/audit_frontend_module` (Mandatory)**
    - [ ] Test React Query Optimistic Cache khi kéo thả thẻ Kanban. 
    - [ ] Test scope xem Tenant có thấy ticket phòng khác không. 
    - [ ] Kiểm tra và cập nhật Sidebar Links (Tickets).

### 4.3 Handovers (Check-in/Check-out)
- [ ] **Step 1: `/scaffold_frontend_module`**
    - [ ] Khởi tạo thư mục `handovers`.
- [ ] **Step 2: `/extend_frontend_module`**
    - [ ] **Management Space**: Form sinh Checklists tự động (`HandoverItems`), Tích hợp `MediaUploader` chốt trạng thái hỏng hóc, Form chụp điện nước cuối kỳ, Xác nhận thanh lý / Khóa bàn giao.
- [ ] **Step 3: `/audit_frontend_module` (Mandatory)**
    - [ ] Load Test trên danh mục 100 tài sản xem UI Form có chậm không. 
    - [ ] Chạy audit RBAC và Sidebar Links (Handovers).

---

## Phase 5: Dashboards & Reporting (Week 5)

### 5.1 Dashboards
- [ ] **Step 1: `/scaffold_frontend_module`**
    - [ ] Khởi tạo thư mục `dashboard`.
- [ ] **Step 2: `/extend_frontend_module`**
    - [ ] **Management Space `/manage`**: Bar chart cho Doanh thu hàng tháng, Pie chart cho Tỷ lệ lấp đầy phòng, Timeline chart cho Tickets.
    - [ ] **System Admin Space `/admin`**: Cấu hình biểu đồ tổng quản lý tất cả Tổ chức (Orgs).
- [ ] **Step 3: `/audit_frontend_module` (Mandatory)**
    - [ ] Clean resources, Optimize payload đồ thị. 
    - [ ] Kiểm tra và hoàn thiện toàn bộ hệ thống Sidebar UI/UX lần cuối.
