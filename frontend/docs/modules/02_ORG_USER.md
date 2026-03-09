# Module: Tổ chức & Người dùng (Org & User)

## Tổng quan
Module quản lý đơn vị tổ chức (Org) là Công ty/Ban quản lý, và toàn bộ thành viên trong tổ chức đó.

**Controllers:**
- `App\Http\Controllers\Api\Org\OrgController` (Thin Controller)
- `App\Http\Controllers\Api\Org\UserController` (Thin Controller)

**Services:**
- `App\Services\Org\OrgService`
- `App\Services\Org\UserService`

**Policies:**
- `App\Policies\Org\OrgPolicy`
- `App\Policies\Org\UserPolicy`

---

## Org Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/orgs` | Danh sách tổ chức | Admin, Owner |
| `POST`   | `/api/orgs` | Tạo tổ chức mới | Admin |
| `GET`    | `/api/orgs/{id}` | Chi tiết tổ chức | Admin, Owner |
| `PUT`    | `/api/orgs/{id}` | Cập nhật tổ chức | Admin, Owner |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Quản lý Tổ chức (Cài đặt hệ thống)**:
    - Hiển thị thông tin Công ty/Ban quản lý: Tên, Logo, SĐT, Địa chỉ, Email.
    - Cấu hình múi giờ và tiền tệ mặc định cho toàn bộ hệ thống.
- [ ] **Quản lý Nhân sự (Member Management)**:
    - Danh sách thành viên trong tổ chức kèm Role và trạng thái (Active/Inactive).
    - Bộ lọc theo chức vụ (Manager, Staff).
    - Nút "Sửa quyền" hoặc "Tạm khóa" thành viên.
- [ ] **Quy trình mời thành viên (Invitation Flow)**:
    - Nhập email và chọn Role để gửi thư mời.
    - Theo dõi danh sách thư mời: `Đã gửi`, `Đã chấp nhận`, `Hết hạn`.
    - Thu hồi thư mời nếu gửi nhầm.

### 2. Query Parameters (Filters & Search)
*Endpoint: `GET /api/users`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `search` | string | Tìm theo tên, email, SĐT |
| `filter[role]` | string | Admin, Owner, Manager, Staff, Tenant |
| `filter[is_active]` | boolean | `true`/`false` |
| `filter[property_id]` | uuid | Lọc nhân sự theo tòa nhà quản lý |
| `sort` | string | `full_name`, `created_at`, `last_login_at` |
| `page`, `per_page` | int | Phân trang chuẩn |

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/invitations`**
```json
{
  "email": "manager.new@example.com",
  "role": "Manager",
  "property_ids": ["uuid-property-1", "uuid-property-2"],
  "note": "Mời quản lý cơ sở 1"
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/users`**
```json
{
  "data": [
    {
      "id": "...",
      "full_name": "Trần Văn B",
      "email": "vanb@example.com",
      "roles": ["Staff"],
      "is_active": true,
      "properties": [
         { "name": "Hostech Tower A" }
      ]
    }
  ],
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  },
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 72
  }
}
```

---

## 🔐 Phân quyền RBAC Backend & Yêu cầu Frontend

Hệ thống module **Tổ chức & Người dùng** (Org & User) chịu sự kiểm soát nghiêm ngặt bởi `OrgPolicy`, `UserPolicy`, `UserInvitationPolicy` kết hợp với Scope Hierarchy ở tầng `UserService`.

### 1. Ma trận phân quyền Backend (Backend Policies)

| Đối tượng (Module) | Quyền hạn | Owner | Manager | Staff | Tenant |
|--------------------|-----------|:---:|:---:|:---:|:---:|
| **Orgs** (Tổ chức) | Xem (view) | ✅ (Only Own) | ❌ | ❌ | ❌ |
| | Sửa (update) | ✅ (Only Own) | ❌ | ❌ | ❌ |
| **Users** (Nhân sự) | Xem danh sách | ✅ (All in Org) | ✅ (Filtered) | ✅ (Filtered)| ❌ |
| | Tạo mới (create) | ✅ | ❌ | ❌ | ❌ |
| | Cập nhật (update)| ✅ | ❌ | ❌ | ❌ |
| | Xóa (delete) | ✅ | ❌ | ❌ | ❌ |
| **Invitations** (Lời mời)| Tạo (create) | ✅ | ✅ | ❌ | ❌ |
| | Thu hồi (delete) | ✅ | ✅ | ❌ | ❌ |

### 2. Logic Bảo mật ngầm định (Backend Enforcements)

- **Org Isolation**: API tự động filter dữ liệu theo `org_id` của người gọi ngay từ Middleware `ResolveTenant`. Người dùng ở Org A (ngay cả Owner) không thể thấy hay can thiệp người dùng ở Org B.
- **Admin System Bypass**: Role `Admin` (không có `org_id`) có quyền CRUD trên toàn bộ hệ thống ở mức System level.
- **Property-based Scoping**: Role `Manager` và `Staff` chỉ có thể xem danh sách User thuộc về các Property (Tòa nhà) mà họ được phân công quản lý.
- **Role Hierarchy Shield**: 
  - `Owner` có thể tạo user với các role thấp hơn (`Manager`, `Staff`, `Tenant`).
  - `Manager` không thể tạo User trực tiếp, nhưng **ĐƯỢC PHÉP** tạo Invitation (Thư mời) để mời người khác vào hệ thống.

### 3. Yêu cầu thiết kế UI/UX Frontend theo từng Role

Dựa vào quy tắc bảo mật trên, giao diện (React/Vue) cần được cấu trúc theo các nhóm quyền sau:

#### 🧑‍💻 Dành cho `Tenant` (Khách thuê)
- **Menu Navigation**: **Ẩn hoàn toàn** các menu liên quan đến "Cài đặt tổ chức" hay "Quản lý nhân sự".

#### 👔 Dành cho `Manager` và `Staff` (Quản lý cấp trung & Nhân viên)
- **Menu Navigation**: 
  - Ẩn menu "Cài đặt tổ chức" (Không có quyền đọc chức năng Org).
  - Hiển thị menu "Quản lý thành viên".
- **Giao diện Quản lý Thành viên (Member Management)**:
  - Chỉ được cấp quyền **Xem danh sách (Read-Only)**. Dữ liệu trả về mặc định đã được lọc theo Property của người dùng hiện tại.
  - Các nút hành động "Thêm mới User", "Sửa", "Xóa" phải bị **vô hiệu hóa (disabled)** hoặc **ẩn (hidden)** hoàn toàn do không có quyền (`create Users`, `update Users`).
- **Giao diện Lời mời (Invitations)** (Chỉ dành cho Manager):
  - Cho phép nút "Mời thành viên" (Create Invitation). Manager được phép gửi thư mời. (`Staff` không có quyền này).

#### 👑 Dành cho `Owner` (Chủ sở hữu Tổ chức)
- **Menu Navigation**: Hiển thị toàn bộ nhóm tính năng "Cài đặt hệ thống" và "Cơ cấu tổ chức".
- **Giao diện Cài đặt Tổ chức (Org Settings)**:
  - Trang Profile công ty với thiết kế dạng Form Setting. Cho phép cập nhật Tên, Email liên hệ, Số điện thoại, Address, Múi giờ, Loại tiền tệ mặc định. (Chỉ lấy/sửa duy nhất Org của chính họ).
- **Giao diện Quản lý Thành viên (Member Management)**:
  - Hiển thị bảng dữ liệu (Data Table) đầy đủ sức mạnh: Searching, Filtering theo Role, Pagination.
  - Form tạo mới và Cập nhật hoạt động đầy đủ tính năng. Hành động "Xóa" (Soft delete) và xem danh sách "Thùng rác" (Trash) được hỗ trợ.
- **Giao diện Lời mời (Invitations)**:
  - Quyền quản trị toàn diện: Thêm mới thư mời, Xem danh sách trạng thái thư mời, Thu hồi/Xóa thư mời.

---

## 🛠 Flow tạo tài khoản (Account Provisioning Design)

Việc tạo mới thành viên tham gia hệ thống **nên ưu tiên sử dụng luồng User Invitation** thay vì tự tạo User trực tiếp và đặt mật khẩu giùm:

1. **Owner/Manager** vào giao diện Invitations -> Nhấn "Mời thành viên".
2. Hệ thống gọi `POST /api/invitations` với Payload: `{ email, role_name }`.
3. Backend sinh ra `token` chứa link định tuyến (VD: `https://frontend.domain/invite/{token}`).
4. Dùng tool (cronjob/queue) gửi mail chứa link cho user.
5. User click vào link dẫu đến frontend. Frontend gọi `GET /api/invitations/validate/{token}` để kiểm tra hợp lệ.
6. Nếu hợp lệ, chuyển sang UI nhập **Họ tên, Mật khẩu mới** -> Submit tạo tài khoản hoàn thiện (Đăng ký qua Invite token).
