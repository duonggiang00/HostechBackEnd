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

> File upload sử dụng **Spatie Media Library**. Collection name phụ thuộc vào model gắn vào (e.g., `avatar`, `contract_documents`, `adjustment_evidence`).

---

## Audit Log Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`  | `/api/audit-logs` | Danh sách nhật ký hoạt động | Admin, Owner |
| `GET`  | `/api/audit-logs/{id}` | Chi tiết nhật ký | Admin, Owner |

> Audit log được ghi tự động qua trait `SystemLoggable` trên các model quan trọng. Powered by **Spatie Activity Log**.

---

## User Invitation Endpoints

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `GET`  | `/api/invitations/validate/{token}` | Xác thực mã invite trước khi đăng ký | ❌ Public |
| `POST` | `/api/invitations` | Tạo invitation mới và gửi email | ✅ Required |

---

## Cấu trúc Invite Flow

```
Manager/Owner gửi invite
  → POST /api/invitations (email, role, org_id, properties?)
  → Hệ thống tạo invitation_token (UUID)
  → Gửi email kèm link frontend: /register?token=xxx
  → Tenant mở link → frontend gọi GET /api/invitations/validate/{token}
  → Nếu hợp lệ → frontend hiển thị form đăng ký
  → Tenant submit → POST /api/auth/register (kèm invitation_token)
  → Hệ thống tự gán role, org_id, property scope
```

---

## Cấu trúc DB

### `user_invitations`
| Field | Mô tả |
|-------|-------|
| `token` | UUID token dùng 1 lần |
| `email` | Email người được mời |
| `role` | Role sẽ được gán sau đăng ký |
| `org_id` | Tổ chức để gán vào |
| `property_ids` | JSON danh sách property scope (cho Manager/Staff) |
| `invited_by` | User ID người gửi |
| `expires_at` | Thời hạn token (default 7 ngày) |
| `accepted_at` | NULL = chưa dùng |
| `status` | PENDING / ACCEPTED / EXPIRED / CANCELLED |

---

## Lưu ý thiết kế
- Token chỉ dùng được **1 lần** và **không thể tái sử dụng** sau khi accepted
- Email của invitation phải **khớp** với email đăng ký → tránh người khác dùng link
- Invitation hết hạn sau 7 ngày (có thể cấu hình trong `UserInvitationService`)
- Media upload trả về object media với `id`, `url`, `mime_type` → sau đó có thể attach vào model bất kỳ
