# Kế hoạch Triển khai Frontend theo từng Backend Module
> Tài liệu mapping chi tiết kế hoạch làm frontend tương ứng với từng module của backend.

## 1. Module Auth & Profile (Nền tảng)
- **Tình trạng Backend:** Đã xong (Sanctum + Fortify). Đăng nhập, Profile, Upload Avatar, 2FA.
- **Frontend Tasks:**
  - Hoàn thiện trang Login (`src/Pages/Client/Login.tsx`).
  - Xử lý store Sanctum Token đúng chuẩn vào Zustand (`AuthStore.ts`).
  - Màn hình Thông tin cá nhân (`/admin/profile`): Cập nhật thông tin (Tên, SDT, CCCD).
  - Component Upload Avatar (tích hợp API `POST /api/profile/avatar`).
  - Tích hợp TOTP (Giao diện setup quét mã QR 2FA).

## 2. Module System (Audit Log & Media)
- **Tình trạng Backend:** Đã xong (`/api/media/upload`, `/api/audit-logs`).
- **Frontend Tasks:**
  - Tạo một Component dùng chung `MediaUpload.tsx` tái sử dụng toàn dự án (vd: upload ảnh hóa đơn, ảnh phòng).
  - (Tùy chọn) Màn hình xem Audit Log cho SuperAdmin tại `/admin/audit-logs`.

## 3. Module Organization & User (Quản lý Quyền - RBAC)
- **Tình trạng Backend:** Đã xong (CRUD Org, CRUD User, User Invitation, Assign Role).
- **Frontend Tasks:**
  - `src/features/users/`: 
    - Giao diện Admin quản lý tổ chức (Tạo mới Org/Tenant context).
    - Quản lý danh sách Staff/Tenant trong cùng Org.
    - Cửa sổ Invite User bằng Email kèm chọn Role hiện tại (Manager, Staff...).
  - Component Custom: `<HasRole role={['Manager', 'Owner']}> ... </HasRole>` để bọc/ẩn các nút nhạy cảm.

## 4. Module Property (Tòa nhà, Tầng, Phòng, Trạng thái tài sản)
- **Tình trạng Backend:** Đã xong. Tenant scoping được áp dụng khi có hợp đồng thuê. RoomAsset CRUD ok.
- **Frontend Tasks:**
  - `src/features/properties/`:
    - Giao diện `Property List` (Card view / Table view). Tích hợp search.
    - `Property Detail`: Chứa sơ đồ Tầng (Floor) (Dạng Accordion hoặc Tab). Mỗi tầng hiển thị Grid các Phòng.
    - Form Tạo/Sửa Phòng (Trạng thái phòng trống/có khách).
    - Component Bảng/Form quản lý tài sản (`Room Asset`).

## 5. Module Service (Dịch vụ)
- **Tình trạng Backend:** Đã xong (Truy vấn Base Services và Room Services).
- **Frontend Tasks:**
  - `src/features/services/`:
    - Danh mục dịch vụ gốc của Org (Tên, Đơn giá mặc định).
    - Component `RoomServiceAssigner`: Gắn dịch vụ (ví dụ Điện, Nước, Wifi) vào phòng kèm ghi đè giá bán riêng cho từng phòng.

## 6. Module Contract (Hợp đồng) - Core Logic!
- **Tình trạng Backend:** Đã xong API xử lý Member, Tenant Signature Flow, Xin đổi phòng.
- **Frontend Tasks:**
  - `src/features/contracts/`:
    - **Portal Manager:** Danh sách hợp đồng (Table), Xem hợp đồng và xuất File In. Form tạo Contract mới gán người dùng vào Phòng. Form hủy hợp đồng.
    - **Portal Tenant (Tenant Self-service):** Trang `My Contracts`. Chỗ duyệt chấp thuận (Accept) cấu trúc hợp đồng. Form Mời Roommate chung phòng. Giao diện xin đổi phòng.

## 7. Module Meter & Invoice (Chỉ số Môi trường & Hóa đơn)
- **Tình trạng Backend:** Đã xong Invoice (Kèm hierarchical view tòa/tầng), MeterReading. (Chỉ còn thiếu flow tự tạo hóa đơn liên kết với số meter, dự tính Backend bổ sung Cronjob).
- **Frontend Tasks:**
  - `src/features/invoices/`:
    - Bảng Ghi số: (Rất quan trọng về UX) Grid view cho phép nhập nhanh số cũ, số mới cho các dịch vụ đo đếm từng phòng. (Có thể dùng thư viện kiểu Excel-like hoặc React-Data-Grid kết hợp Antd Table).
    - Quản lý Ticket Điều chỉnh (`Adjustment Notes`): Giao diện duyệt yêu cầu giảm trừ.
    - Danh sách Invoice: View lọc Trạng thái (Draft/Sent/Paid), Nút Đánh dấu Đã thanh toán (Log payment). Trả về thiết kế Hóa đơn (Printable Layout Component).

## 8. Module Ticket (Yêu cầu/Khiếu nại)
- **Tình trạng Backend:** Đã xong CRUD, Status flow, Tenant Scope. Đi kèm MediaLibrary.
- **Frontend Tasks:**
  - `src/features/tickets/`:
    - Kanban Board: Hiển thị ticket cho admin kéo thả (`OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED`). Tích hợp `@hello-pangea/dnd`.
    - Tenant view: Giao diện form tạo yêu cầu đơn giản có drag & drop ảnh lỗi phòng. Box chat/comment cho `TicketComment` (Giao diện giống tin nhắn Zalo/FB).

## 9. Module Handover (Bàn giao Nhận/Trả)
- **Tình trạng Backend:** Đã xong (HandoverRecord, HandoverItem, Approval flow).
- **Frontend Tasks:**
  - `src/features/handover/`:
    - Checklist xác nhận tình trạng trang thiết bị khi vào/ra phòng.
    - Checkbox list + Form Upload ảnh minh họa tình trạng.

## 10. Module Dashboard / Statistics
- **Tình trạng Backend:** Chưa làm. Có thể query thủ công gom dữ liệu.
- **Frontend Tasks:**
  - Component `Recharts` hoặc `Antd Charts`: Vẽ biểu đồ cột doanh thu, biểu đồ tròn (Pie chart) tình trạng lấp đầy phòng trống/có khách.
