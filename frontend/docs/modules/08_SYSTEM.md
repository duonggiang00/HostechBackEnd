# Module: Hệ thống (System)

## Tổng quan
Module hệ thống bao gồm quản lý file/media, nhật ký hoạt động (Audit Log) và tiện ích hệ thống chung.

**Controllers:**
- `App\Http\Controllers\Api\System\MediaController`
- `App\Http\Controllers\Api\System\AuditLogController`
- `App\Http\Controllers\Api\System\UserInvitationController`
- `App\Http\Controllers\UploadController`

---

## Media / File Upload Endpoints

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/media/upload` | Upload file chung (trả về media UUID) | ✅ Required |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Xử lý Upload Media**:
    - Khi user chọn file (Ảnh CCCD, Ảnh bàn giao, Avatar), gọi endpoint `/api/media/upload`.
    - Backend trả về `media_uuid`.
    - Frontend lưu danh sách `media_uuid` này để gửi kèm vào request chính (VD: POST `/api/contracts` kèm `media_uuids`).
- [ ] **Nhật ký hoạt động (Audit Logs)**:
    - Trang hiển thị lịch sử thay đổi của hệ thống (dành cho Owner).
    - Hiển thị: Ai đã làm gì, vào lúc nào, giá trị cũ và giá trị mới.
- [ ] **Xác thực lời mời (Invitation Landing)**:
    - Xây dựng route `/register?token=...`.
    - Khi trang load, gọi `GET /api/invitations/validate/{token}`.
    - Nếu hợp lệ: Hiện form đăng ký với email đã được fixed.
    - Nếu không: Hiển thị lỗi "Lời mời không hợp lệ hoặc đã hết hạn".

### 2. Dữ liệu gửi lên (Request Example)
**POST `/api/media/upload`** (Multipart/Form-Data)
```
file: [Binary Data]
collection: "contract_documents"
```

### 3. Dữ liệu trả về (Response Example)
**GET `/api/audit-logs`**
```json
{
  "data": [
    {
      "description": "updated Room R101",
      "subject_type": "Room",
      "causer": { "name": "Admin" },
      "properties": {
        "attributes": { "status": "rented" },
        "old": { "status": "available" }
      },
      "created_at": "..."
    }
  ]
}
```

---

## 🔐 Phân quyền RBAC Backend & Yêu cầu Frontend

Hệ thống module **System** có hai nhánh dữ liệu chính: `Audit Logs` (nhật ký hệ thống) bị kiểm soát gắt gao bởi policy, và `Media` (File upload) là tiện ích mở cho mọi người dùng đã đăng nhập.

### 1. Ma trận phân quyền Backend (Backend Policies)

Dựa trên cấu hình `AuditLogPolicy` và logic `Media`:

| Đối tượng (Module) | Quyền hạn | Owner | Manager | Staff | Tenant |
|--------------------|-----------|:---:|:---:|:---:|:---:|
| **Audit Logs** | Xem danh sách | ✅ (Only Own Org) | ❌ | ❌ | ❌ |
| | Xem chi tiết | ✅ (Only Own Org) | ❌ | ❌ | ❌ |
| **Media** | Tải lên file | ✅ | ✅ | ✅ | ✅ |

### 2. Logic Bảo mật ngầm định (Backend Enforcements)

- **Audit Log Isolation**: Quá trình lấy danh sách Logs (`AuditLogService@paginate`) tự động filter theo `org_id` của `User`, do đó Owner ở Org A sẽ không bao giờ xem được log của Org B. Role `Admin` được bypass và xem toàn bộ log hệ thống.
- **Media Open Access**: Controller upload file (Media) không áp đặt rào cản Policy (bypass). Mọi người dùng đã xác thực thông qua Sanctum Token đều có thể upload file. File sẽ được gắn `causer_id` để track người upload nếu cần sau này.

### 3. Yêu cầu thiết kế UI/UX Frontend theo từng Role

#### 🧑‍💻 Dành cho `Manager`, `Staff` & `Tenant`
- **Menu Navigation**: **Ẩn hoàn toàn** menu "Nhật ký hoạt động" (Audit Logs). Họ không có quyền đọc (`R`) đối với phân hệ này và sẽ nhận lỗi `403` nếu cố truy cập.
- **Uploading UI**: Trên các form tài liệu hoặc xử lý biên bản, họ có thể sử dụng bình thường các tính năng upload file đính kèm.

#### 👑 Dành cho `Owner` (Chủ sở hữu Tổ chức)
- **Menu Navigation**: Hiển thị menu "Nhật ký hoạt động" hoặc "Lịch sử hệ thống".
- **Giao diện Audit Logs (Lịch sử HĐ)**:
  - Bản chất là một hệ thống tracking (ai làm gì, vào lúc nào).
  - Cần hiển thị ở dạng Bảng dữ liệu (Data Table) hoặc Data Timeline.
  - Hỗ trợ các bộ lọc (Filters): Tìm theo Tên sự kiện (`event`), Loại dữ liệu (`subject_type` - Vd: `Room`, `User`, `Contract`), Người thực hiện (`causer_id`).
  - Nút Mở rộng (Expand) hoặc Xem chi tiết: Hiển thị một khung chứa dữ liệu trước và sau khi thay đổi (Old vs New attributes) dưới định dạng JSON JSON-Viewer dễ nhìn, hoặc bảng so sánh (diff). Tỉnh lược các trường không thay đổi.
