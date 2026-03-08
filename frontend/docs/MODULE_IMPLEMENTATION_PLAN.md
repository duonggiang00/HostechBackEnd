# Kế hoạch Triển khai Frontend theo từng Backend Module
> Tài liệu mapping chi tiết kế hoạch làm frontend tương ứng với từng module của backend.

---

## 📂 Danh mục Tài liệu Module
Chi tiết API, RBAC và Hướng dẫn UI cho từng module:

| Thứ tự | Module | Tài liệu chi tiết | Trạng thái |
|--------|--------|-------------------|-----------|
| 01 | Auth & Profile | [01_AUTH_PROFILE.md](modules/01_AUTH_PROFILE.md) | ✅ Backend Done |
| 02 | Organization & User | [02_ORG_USER.md](modules/02_ORG_USER.md) | ✅ Backend Done |
| 03 | Property, Floor, Room | [03_PROPERTY_FLOOR_ROOM.md](modules/03_PROPERTY_FLOOR_ROOM.md) | ✅ Backend Done |
| 04 | Contract (Hợp đồng) | [04_CONTRACT.md](modules/04_CONTRACT.md) | ✅ Backend Done |
| 05 | Service (Dịch vụ) | [05_SERVICE.md](modules/05_SERVICE.md) | ✅ Backend Done |
| 06 | Meter & Reading | [06_METER_READING.md](modules/06_METER_READING.md) | ✅ Backend Done |
| 07 | Invoice (Hóa đơn) | [07_INVOICE.md](modules/07_INVOICE.md) | ✅ Backend Done |
| 08 | System (Media, Audit, Invite) | [08_SYSTEM.md](modules/08_SYSTEM.md) | ✅ Backend Done |
| 09 | Ticket (Sự cố) | [09_TICKET.md](modules/09_TICKET.md) | ✅ Backend Done |
| 10 | Handover (Bàn giao) | [10_HANDOVER.md](modules/10_HANDOVER.md) | ✅ Backend Done |

---

## 🛠️ Trình tự Triển khai (Roadmap)

### Phase 1: Foundation & Security
- **Module Auth & Profile:** Hoàn thiện Login, Register (Invite), Profile, 2FA.
- **Module System:** Media Upload component dùng chung toàn dự án.

### Phase 2: Property & RBAC
- **Module Organization & User:** Quản lý Staff, Tenant, Gán Role, Invite User.
- **Module Property:** Quản lý Tòa nhà, Tầng, Phòng, Tài sản phòng.

### Phase 3: Operations (Core Logic)
- **Module Service:** Danh mục dịch vụ và gán dịch vụ cho phòng.
- **Module Contract:** Quy trình tạo hợp đồng, ký hợp đồng điện tử (Tenant Portal).
- **Module Meter & Reading:** Ghi chỉ số, điều chỉnh chỉ số.

### Phase 4: Financial & Support
- **Module Invoice:** Xuất hóa đơn, quản lý chi phí phát sinh, theo dõi thanh toán.
- **Module Ticket:** Hệ thống quản lý sự cố (Kanban cho Manager, Form cho Tenant).
- **Module Handover:** Biên bản bàn giao khi nhận/trả phòng.

### Phase 5: Dashboard & UX
- **Statistics:** Biểu đồ doanh thu, tỷ lệ lấp đầy.
- **Optimizations:** Nâng cao trải nghiệm người dùng, performance.

---

## 📚 Tài liệu Hướng dẫn Chung
- [Kiến trúc Frontend](ARCHITECTURE.md)
- [Tiêu chuẩn API](API_STANDARDS.md)
- [Checklist Tiến độ](IMPLEMENTATION_CHECKLIST.md)
- [Hướng dẫn Workflow](FRONTEND_WORKFLOW_GUIDE.md)

---

---

## 📝 Chi tiết Công việc Frontend (Tasks)

### 1. Module Auth & Profile
- **Auth Flow:** Hoàn thiện trang Login (`src/Pages/Client/Login.tsx`) và xử lý Sanctum Token vào Zustand (`AuthStore.ts`).
- **Profile:** Màn hình Thông tin cá nhân (`/admin/profile`) cập nhật Tên, SĐT, CCCD.
- **Security:** Tích hợp Component Upload Avatar (`POST /api/profile/avatar`) và giao diện setup 2FA (TOTP QR).

### 2. Module System (Audit Log & Media)
- **Shared Components:** Tạo `MediaUpload.tsx` tái sử dụng toàn dự án (ảnh hóa đơn, ảnh phòng, ticket).
- **Audit Logs:** Giao diện xem lịch sử hoạt động cho SuperAdmin tại `/admin/audit-logs`.
- **Invitations:** Xử lý xác thực Token mời tại trang `/register?token=...`.

### 3. Module Organization & User (RBAC)
- **Features (`src/features/users/`):**
  - Quản lý Org: Tạo mới Org/Tenant context.
  - Quản lý Member: Danh sách Staff/Tenant, phân quyền Role, Invite qua Email.
- **RBAC UI:** Triển khai Component `<HasRole role={['Manager', 'Owner']}>` để kiểm soát hiển thị thao tác nhạy cảm.

### 4. Module Property (Building, Floor, Room)
- **Features (`src/features/properties/`):**
  - Property List: Card/Table view với search & filter.
  - Property Detail: View phân cấp Tòa nhà -> Tầng (Accordion/Tab) -> Phòng (Grid).
  - Room Management: Form tạo/sửa phòng, quản lý tài sản (`Room Asset`).

### 5. Module Service (Dịch vụ)
- **Features (`src/features/services/`):**
  - Catalog: Quản lý danh mục dịch vụ gốc của Org (Tên, Đơn giá mặc định).
  - Assign: Component `RoomServiceAssigner` để gắn dịch vụ cho phòng và ghi đè giá (`custom_price`).

### 6. Module Contract (Hợp đồng) - Core Logic
- **Features (`src/features/contracts/`):**
  - **Portal Manager:** Quản lý danh sách, xem/in hợp đồng, tạo mới, thanh lý hợp đồng.
  - **Portal Tenant:** View `My Contracts`, luồng ký điện tử (Accept Signature), mời roommate, yêu cầu đổi phòng.

### 7. Module Meter & Invoice (Chỉ số & Hóa đơn)
- **Features (`src/features/invoices/`):**
  - **Ghi số (UX focused):** Grid view nhập nhanh số cũ/mới (Excel-like / React-Data-Grid).
  - **Invoice Management:** View lọc trạng thái (Draft/Sent/Paid), ghi nhận thanh toán (`Log payment`), xuất Printable Layout.
  - **Adjustments:** Duyệt phiếu điều chỉnh (`Adjustment Notes`).

### 8. Module Ticket (Yêu cầu/Khiếu nại)
- **Features (`src/features/tickets/`):**
  - **Manager:** Kanban Board cho Staff kéo thả (`OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED`).
  - **Tenant:** Form tạo yêu cầu với Drag & Drop media, box chat/comment (`TicketComment`).

### 9. Module Handover (Bàn giao)
- **Features (`src/features/handover/`):**
  - Checklist: Xác nhận tình trạng thiết bị khi nhận/trả phòng.
  - Verification: Form upload ảnh minh họa và checklist checkbox.

### 10. Module Dashboard / Statistics
- **Visualization:** Dùng `Recharts` hoặc `Antd Charts` vẽ biểu đồ doanh thu, tỷ lệ lấp đầy.
