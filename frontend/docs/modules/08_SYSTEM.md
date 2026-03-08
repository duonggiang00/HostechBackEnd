# Module: Hệ thống (Media, Audit, Invite)

## Tổng quan
Module cung cấp các tiện ích dùng chung cho toàn bộ hệ thống như: Upload ảnh/file, Nhật ký hoạt động (Audit log) và Xác thực lời mời thành viên.

**Controllers:**
- `App\Http\Controllers\Api\System\MediaUploadController`
- `App\Http\Controllers\Api\System\AuditLogController`
- `App\Http\Controllers\Api\Org\InvitationController`

---

## API Endpoints

| Method | Endpoint | Chức năng | Role |
|--------|----------|-----------|------|
| `POST` | `/api/media/upload` | Upload file/ảnh đơn lẻ | ✅ Required |
| `GET`  | `/api/audit-logs` | Danh sách nhật ký | Owner, Admin |
| `GET`  | `/api/audit-logs/{id}` | Xem chi tiết thay đổi | Owner, Admin |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Component Upload Media dùng chung**:
    - Tạo Component `MediaUploader` (hỗ trợ kéo thả).
    - Ngay khi chọn file, tự động gọi API `/api/media/upload`.
    - Nhận về `uuid` của file và lưu vào state của Form chính (VD: Form tạo Ticket, Form Handover).
- [ ] **Trang Nhật ký hoạt động (Audit Logs)**:
    - Bảng danh sách: Ai đã thực hiện (Causer), Hành động (Created/Updated/Deleted), Trên bản ghi nào (Subject), Thời gian.
    - Chip hiển thị màu sắc theo hành động (VD: Delete màu đỏ).
    - Xem chi tiết: Hiển thị Object `old_values` và `new_values` để so sánh thay đổi.
- [ ] **Trang Landing lời mời (Invitation Landing)**:
    - Route: `/register?token=...`
    - Gọi API validate token khi trang load.
    - Nếu hợp lệ: Hiển thị form đăng ký (Email đã được fix cứng từ lời mời).

### 2. Query Parameters (Audit Logs)
*Endpoint: `GET /api/audit-logs`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `search` | string | Tìm theo tên người thực hiện hoặc ID bản ghi |
| `filter[event]` | string | `created`, `updated`, `deleted`, `restored` |
| `filter[causer_id]` | uuid | Xem hoạt động của 1 nhân viên cụ thể |
| `sort` | string | Mặc định `-created_at` |

### 3. Dữ liệu trả về (Audit Log Detail Example)
**GET `/api/audit-logs/{id}`**
```json
{
  "data": {
    "id": "...",
    "event": "updated",
    "subject_type": "Room",
    "causer": { "name": "Admin" },
    "properties": {
      "old": { "status": "available" },
      "attributes": { "status": "maintenance" }
    },
    "created_at": "..."
  }
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

- **Audit Logs**: Chỉ hiển thị cho Super Admin hoặc Role `Owner` của tổ chức.
- **Invitations**: Endpoint validate token là Public, nhưng endpoint tạo invitation yêu cầu quyền `Manager` trở lên.
