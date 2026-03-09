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

## Profile Endpoints

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `GET`  | `/api/profile` | Lấy đầy đủ hồ sơ cá nhân | ✅ Required |
| `PUT`  | `/api/profile` | Cập nhật hồ sơ | ✅ Required |
| `POST` | `/api/profile/avatar` | Upload ảnh đại diện | ✅ Required |
| `GET`  | `/api/profile/mfa-status` | Kiểm tra trạng thái MFA | ✅ Required |
| `POST` | `/api/profile/change-password` | Đổi mật khẩu | ✅ Required |

---

## 🔐 Phân quyền RBAC Backend & Yêu cầu Frontend

Hệ thống sử dụng cơ chế kiểm tra `roles` cho cấu trúc điều hướng lớn và `permissions` cho từng hành động cụ thể.

### 1. Logic chung (Backend Enforcements)
- **Account Status**: Nếu `is_active = false`, mọi request sẽ trả về `401/403`. Frontend cần tự phát hiện trạng thái này (thường qua `GET /api/auth/me`) để chặn UI và redirect ra trang đăng nhập với thông báo "Tài khoản bị khóa".
- **Own Profile**: Mọi người dùng đã đăng nhập (bất kể Role) đều có quyền xem và cập nhật hồ sơ cá nhân của chính mình. (Policy bypass/Profile API no policy require).

### 2. Ma trận phân quyền Quản lý Người dùng (Users Module)

Dựa trên `UserPolicy`, module **Users** có cấu hình quyền như sau dựa vào Role:

| Quyền hạn Backend | Owner | Manager | Staff | Tenant |
|-------------------|:---:|:---:|:---:|:---:|
| `viewAny Users` (Xem danh sách) | ✅ | ✅ | ✅ | ❌ |
| `view Users` (Xem chi tiết) | ✅ | ✅ | ❌ | ❌ |
| `create Users` (Tạo mới) | ✅ | ❌ | ❌ | ❌ |
| `update Users` (Cập nhật) | ✅ | ❌ | ❌ | ❌ |
| `delete Users` (Xóa) | ✅ | ❌ | ❌ | ❌ |

### 3. Yêu cầu thiết kế UI/UX Frontend theo từng Role

Dựa vào ma trận quyền, Frontend cần thiết kế luồng trải nghiệm (UI/UX) tương ứng cho từng nhóm người dùng:

#### 🧑‍💼 Dành cho Role `Tenant` (Khách thuê)
- **Menu Navigation**: **Ẩn hoàn toàn** menu hoặc mục "Quản lý Người dùng" (User Management).
- **Profile Area**: Cho phép truy cập trang "Hồ sơ cá nhân" từ trên thanh Header. Tại đây có đầy đủ form cập nhật thông tin (Họ tên, ngày sinh, CCCD, ...), tải ảnh đại diện và form đổi mật khẩu. Đảm bảo UI thân thiện, thiết kế dạng Card trực quan.

#### 👔 Dành cho Role `Manager` và `Staff` (Quản lý & Nhân viên)
- **Menu Navigation**: Hiển thị menu "Quản lý Người dùng".
- **List View (Bảng danh sách)**: 
  - Khả dụng các tính năng: Tìm kiếm (Search), Lấy danh sách phân trang, Lọc theo Role/Trạng thái (Filter), Sắp xếp (Sort). Dữ liệu mặc định được hệ thống tự lọc theo Property.
  - Yêu cầu UI: **Ẩn các nút "Thêm mới"**, **Dòng hành động (Actions column)** chỉ nên hiện nút "Xem chi tiết" (thường là biểu tượng con mắt). Tuyệt đối **không hiển thị nút "Sửa" hay "Xóa"**.
- **Detail View (Trang chi tiết)**: 
  - `Manager` có thể xem read-only thông tin của User khác. Các trường input phải ở trạng thái `disabled`. `Staff` không có quyền xem chi tiết.

#### 👑 Dành cho Role `Owner` / `Admin` (Chủ nhà/Quản trị viên)
- **Menu Navigation**: Hiển thị menu "Quản lý Người dùng".
- **List View (Bảng danh sách)**:
  - Hiển thị đầy đủ nút "Thêm mới".
  - Trong Data Table, cột Actions hiển thị đủ bộ nút thao tác: "Xem", "Sửa", "Xóa".
  - Bổ sung nút "Thùng rác" hoặc Filter để chuyển qua giao diện xem danh sách User đã xóa (Soft Delete) từ API `trash`.
- **Detail / Form View**:
  - Giao diện Form "Thêm mới" và "Sửa" hoạt động đầy đủ.
  - Hỗ trợ khôi phục (`restore`) và Xóa vĩnh viễn (`forceDelete`) trên UI khi đang ở chế độ xem Thùng rác.

---

## Module Feature Matrix (Users)

| Feature | `auth/me` | `profile` | `users.index` | `users.trash` |
|---------|-----------|-----------|---------------|---------------|
| Searching | ❌ | ❌ | ✅ | ✅ |
| Filtering | ❌ | ❌ | ✅ | ✅ |
| Sorting | ❌ | ❌ | ✅ | ✅ |
| Pagination | ❌ | ❌ | ✅ | ✅ |
