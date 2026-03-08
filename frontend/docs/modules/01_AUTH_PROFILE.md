# Module: Xác thực & Hồ sơ cá nhân (Auth & Profile)

## Tổng quan
Module xử lý toàn bộ luồng xác thực người dùng (đăng ký, đăng nhập, đăng xuất) và quản lý hồ sơ cá nhân (thông tin, avatar, đổi mật khẩu, bảo mật 2 lớp).

**Controllers:**
- `Laravel\Fortify` (Auth - đăng ký, đăng nhập, reset mật khẩu)
- `App\Http\Controllers\Api\Org\ProfileController` (Thin Controller)

**Services:**
- `App\Services\Org\ProfileService` (Xử lý logic cập nhật hồ sơ, đổi mật khẩu, upload avatar)

**Resources:**
- `App\Http\Resources\Org\UserResource`

---

## Auth Endpoints (Fortify)

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/auth/register` | Đăng ký tài khoản (hỗ trợ mã invite) | ❌ Public |
| `POST` | `/api/auth/login` | Đăng nhập, nhận Sanctum token | ❌ Public |
| `POST` | `/api/auth/logout` | Đăng xuất, hủy token hiện tại | ✅ Required |
| `GET`  | `/api/auth/me` | Lấy thông tin user đang đăng nhập | ✅ Required |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Luồng Xác thực (Authentication Flow)**:
    - Lưu trữ `access_token` vào LocalStorage/Cookie an toàn.
    - Cấu hình Axios Interceptor để đính kèm `Authorization: Bearer <token>` vào mọi request.
    - Xử lý lỗi `401 Unauthorized` để redirect về trang Login.
- [ ] **Quản lý Hồ sơ (Profile Management)**:
    - Giao diện cập nhật thông tin cá nhân (Họ tên, CCCD, Ngày sinh).
    - Upload Avatar: Gửi request `multipart/form-data` tới endpoint `/api/profile/avatar`.
    - Đổi mật khẩu: Yêu cầu mật khẩu cũ và mật khẩu mới.
- [ ] **Bảo mật 2 lớp (2FA)**:
    - Hiển thị QR Code để user quét bằng Google Authenticator/Authy.
    - Form xác nhận mã 6 số để kích hoạt 2FA.
    - Lưu trữ Recovery Codes dự phòng.

### 2. Query Parameters (Danh sách người dùng / Search)
*Endpoint: `GET /api/orgs/{id}/users` (Dành cho Admin/Owner)*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `search` | string | Tìm kiếm theo tên, email, số điện thoại |
| `filter[is_active]` | boolean | Lọc theo trạng thái hoạt động |
| `filter[role]` | string | Lọc theo chức danh (Admin, Manager, Staff, Tenant) |
| `sort` | string | Sắp xếp: `full_name`, `created_at` (prefix `-` để giảm dần) |
| `page` | int | Trang hiện tại |
| `per_page` | int | Số lượng/trang (1-100) |

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/auth/login`**
```json
{
  "email": "user@example.com",
  "password": "password",
  "device_name": "iPhone 15 Pro"
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/auth/me`**
```json
{
  "data": {
    "id": "...",
    "full_name": "Nguyên Văn A",
    "email": "user@example.com",
    "roles": ["Manager"],
    "permissions": ["viewAny Room", "create Room"],
    "avatar_url": "http://.../avatar.jpg",
    "two_factor_enabled": true
  },
  "links": {
    "self": "http://localhost:8001/api/auth/me"
  }
}
```

---

## 🔐 Phân quyền RBAC (Frontend UI Logic)

- **Cấm truy cập**: Nếu `is_active = false`, frontend nên chặn mọi tương tác và hiển thị thông báo "Tài khoản bị khóa".
- **Phân quyền UI**: 
    - Sử dụng mảng `permissions` để ẩn/hiện các nút bấm (VD: nút "Thêm phòng" chỉ hiện nếu có `create Room`).
    - Sử dụng mảng `roles` cho các điều hướng lớn (VD: Role `Tenant` không hiện menu "Cấu hình hệ thống").

---

## Profile Endpoints

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `GET`  | `/api/profile` | Lấy đầy đủ hồ sơ cá nhân | ✅ Required |
| `PUT`  | `/api/profile` | Cập nhật hồ sơ | ✅ Required |
| `POST` | `/api/profile/avatar` | Upload ảnh đại diện | ✅ Required |
