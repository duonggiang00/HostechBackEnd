# Module: Xác thực & Hồ sơ cá nhân (Auth & Profile)

## Tổng quan
Module xử lý toàn bộ luồng xác thực người dùng (đăng ký, đăng nhập, đăng xuất) và quản lý hồ sơ cá nhân (thông tin, avatar, đổi mật khẩu, bảo mật 2 lớp).

**Controller:**
- `Laravel\Fortify` (Auth - đăng ký, đăng nhập, reset mật khẩu)
- `App\Http\Controllers\Api\Org\ProfileController`
- **Resource:** `App\Http\Resources\Org\UserResource`

---

## Auth Endpoints (Fortify)

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/auth/register` | Đăng ký tài khoản (hỗ trợ mã invite) | ❌ Public |
| `POST` | `/api/auth/login` | Đăng nhập, nhận Sanctum token | ❌ Public |
| `POST` | `/api/auth/logout` | Đăng xuất, hủy token hiện tại | ✅ Required |
| `GET`  | `/api/auth/me` | Lấy thông tin user đang đăng nhập qua UserResource | ✅ Required |
| `PUT`  | `/api/auth/user/profile-information` | Cập nhật profile (Fortify native) | ✅ Required |
| `PUT`  | `/api/auth/user/password` | Đổi mật khẩu (Fortify native) | ✅ Required |
| `POST` | `/api/auth/user/two-factor-authentication` | Bật Fortify 2FA (TOTP) | ✅ Required |
| `DELETE` | `/api/auth/user/two-factor-authentication` | Tắt 2FA | ✅ Required |
| `GET`  | `/api/auth/user/two-factor-qr-code` | Lấy QR code cho app TOTP | ✅ Required |
| `GET`  | `/api/auth/user/two-factor-recovery-codes` | Lấy danh sách recovery codes | ✅ Required |
| `POST` | `/api/auth/forgot-password` | Gửi email reset mật khẩu | ❌ Public |
| `POST` | `/api/auth/reset-password` | Reset mật khẩu bằng token | ❌ Public |

---

## Profile Endpoints

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `GET`  | `/api/profile` | Lấy đầy đủ hồ sơ cá nhân (identity, avatar URL, OTP status) | ✅ Required |
| `PUT`  | `/api/profile` | Cập nhật hồ sơ (full_name, email, phone, identity_number, date_of_birth, address, ...) | ✅ Required |
| `POST` | `/api/profile/change-password` | Đổi mật khẩu (yêu cầu mật khẩu cũ) | ✅ Required |
| `POST` | `/api/profile/avatar` | Upload ảnh đại diện (JPG/PNG/WebP, max 2MB) | ✅ Required |
| `GET`  | `/api/profile/mfa-status` | Kiểm tra trạng thái MFA/OTP | ✅ Required |

---

## UserResource — Cấu trúc Response

```json
{
  "data": {
    "id": "uuid",
    "org_id": "uuid",
    "full_name": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone": "0901234567",
    "identity_number": "001234567890",
    "identity_issued_date": "2020-01-15",
    "identity_issued_place": "Cục Cảnh sát ĐKQL cư trú",
    "date_of_birth": "1995-06-20",
    "address": "123 Đường ABC, Quận 1",
    "avatar_url": "https://...",
    "is_active": true,
    "email_verified_at": "...",
    "mfa_enabled": false,
    "mfa_method": null,
    "two_factor_enabled": false,
    "roles": ["Tenant"],
    "permissions": ["viewAny Room", ...],
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

## Lưu ý thiết kế
- Đăng ký có hỗ trợ mã invite (`invitation_token`) do `CreateNewUser` Fortify action xử lý
- Avatar sử dụng **Spatie Media Library**, collection name: `avatar`
- Fortify 2FA dùng TOTP (Google Authenticator), riêng `mfa_enabled` và `mfa_secret_encrypted` là custom fields dự phòng cho luồng SMS OTP tương lai
- `/api/auth/me` và `/api/profile` trả về **cùng UserResource**, chỉ khác cách load eager relations

---

## Phân quyền (RBAC)
Profile của bản thân: **tất cả roles** đều có thể đọc và cập nhật (không cần permission riêng).
