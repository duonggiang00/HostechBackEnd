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
| `GET`    | `/api/orgs` | Danh sách tổ chức (Admin sees all, Owner sees own) | Admin, Owner |
| `POST`   | `/api/orgs` | Tạo tổ chức mới | Admin |
| `GET`    | `/api/orgs/{id}` | Chi tiết tổ chức | Admin, Owner |
| `PUT`    | `/api/orgs/{id}` | Cập nhật tổ chức | Admin, Owner |
| `DELETE` | `/api/orgs/{id}` | Soft delete tổ chức | Admin |
| `GET`    | `/api/orgs/trash` | Danh sách tổ chức đã xóa | Admin |
| `POST`   | `/api/orgs/{id}/restore` | Khôi phục tổ chức | Admin |
| `DELETE` | `/api/orgs/{id}/force` | Xóa vĩnh viễn | Admin |
| `GET`    | `/api/orgs/{id}/properties` | Danh sách tài sản của Org | Admin, Owner, Manager |
| `GET`    | `/api/orgs/{id}/users` | Danh sách thành viên | Admin, Owner |
| `GET`    | `/api/orgs/{id}/services` | Danh sách dịch vụ | Admin, Owner, Manager |

---

## User Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/users` | Danh sách user (theo org scope) | Admin, Owner, Manager |
| `POST`   | `/api/users` | Tạo user mới trong org | Admin, Owner |
| `GET`    | `/api/users/{id}` | Chi tiết user | Admin, Owner, Manager |
| `PUT`    | `/api/users/{id}` | Cập nhật user | Admin, Owner |
| `DELETE` | `/api/users/{id}` | Soft delete user | Admin, Owner |
| `GET`    | `/api/users/trash` | Danh sách user đã xóa | Admin, Owner |
| `POST`   | `/api/users/{id}/restore` | Khôi phục user | Admin, Owner |
| `DELETE` | `/api/users/{id}/force` | Xóa vĩnh viễn | Admin |

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

---

## Role Hierarchy
```
Admin (System Level - no org_id)
  └── Owner (org_id required - tạo và sở hữu Org)
        └── Manager (org_id + property_ids)
              └── Staff (org_id + property_ids)
                    └── Tenant (org_id - qua invite, gắn contract)
```

---

## Phân quyền (RBAC Matrix)

| Hành động | Admin | Owner | Manager | Staff | Tenant |
|-----------|-------|-------|---------|-------|--------|
| CRUD Org | ✅ | 🔶 own | ❌ | ❌ | ❌ |
| CRUD Users | ✅ | 🔶 org | 🔶 lower | ❌ | ❌ |
| View Users | ✅ | ✅ | 🔶 scope | ❌ | ❌ |

> 🔶 = Có nhưng giới hạn theo scope

---

## Lưu ý thiết kế
- `org_id` là `null` cho Admin (system level)
- Owner tạo Org thông qua luồng invite với role `Owner` → auto tạo Org mới
- User được scoped theo `org_id` qua `MultiTenant` trait và `HandlesOrgScope` trait trong Policy
- **Security Logic**: Được đóng gói hoàn toàn trong `UserService` (kiểm tra role hierarchy, org scope khi tạo/cập nhật user).
- **Laravel 12 Standard**: `User` model sử dụng phương thức `casts()` cho attribute casting.
