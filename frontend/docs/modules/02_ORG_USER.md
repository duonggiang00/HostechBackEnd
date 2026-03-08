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

## 🔐 Phân quyền RBAC (Frontend Logic)

- **Owner**: Có quyền cao nhất trong Org, thấy menu "Cài đặt tổ chức" và quản lý toàn bộ User.
- **Manager**: Chỉ quản lý được Staff và Tenant thuộc Tòa nhà mình được phân công. Không thấy menu "Cài đặt tổ chức".
- **Staff**: Không có quyền quản lý User khác.

---

## User Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/users` | Danh sách user (theo org scope) | Admin, Owner, Manager |
| `PUT`    | `/api/users/{id}` | Cập nhật trạng thái/thông tin user | Admin, Owner |
| `DELETE` | `/api/users/{id}` | Gỡ user ra khỏi Org | Admin, Owner |

---

## User Invitation Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/invitations/validate/{token}` | Xác thực mã invite (Public) | ❌ Public |
| `POST`   | `/api/invitations` | Tạo invitation và gửi email | Admin, Owner, Manager |

### Phân quyền Invite theo Role
| Người gửi | Có thể mời Role |
|-----------|-----------------|
| Admin | Owner (+ tạo org mới) |
| Owner | Manager, Staff, Tenant (trong org của mình) |
| Manager | Staff, Tenant (trong phạm vi property được quản) |
