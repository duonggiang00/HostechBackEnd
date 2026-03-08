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

## 🔐 Phân quyền RBAC (Frontend Logic)

- **Audit Logs**: Chỉ hiển thị menu này cho Role `Owner` hoặc `Admin`.
- **Media**: Tất cả các role có quyền tạo dữ liệu (Owner, Manager, Staff, Tenant) đều có thể upload file liên quan đến nghiệp vụ của họ.

---

## Audit Log Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`  | `/api/audit-logs` | Danh sách nhật ký hoạt động | Admin, Owner |

---

## Phân quyền RBAC (Backend Policy)

| Hành động | Admin | Owner | Manager | Staff | Tenant |
|-----------|-------|-------|---------|-------|--------|
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Upload Media | ✅ | ✅ | ✅ | ✅ | ✅ |
