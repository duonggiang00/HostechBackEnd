# Module: Dịch vụ (Service)

## Tổng quan
Module quản lý các dịch vụ đi kèm trong tòa nhà (điện, nước, internet, dọn vệ sinh...) và các gói dịch vụ đăng ký theo phòng.

**Controllers:**
- `App\Http\Controllers\Api\Service\ServiceController`
- `App\Http\Controllers\Api\Service\RoomServiceController`

**Services:**
- `App\Services\Service\ServiceService`

---

## Service (Loại dịch vụ) Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/services` | Danh sách dịch vụ trong Org | Owner, Manager, Staff |
| `POST`   | `/api/services` | Tạo dịch vụ mới | Owner |
| `GET`    | `/api/services/{id}` | Chi tiết dịch vụ | Owner, Manager, Staff |
| `PUT`    | `/api/services/{id}` | Cập nhật dịch vụ | Owner |
| `DELETE` | `/api/services/{id}` | Soft delete | Owner |
| `GET`    | `/api/services/trash` | Thùng rác | Owner |
| `POST`   | `/api/services/{id}/restore` | Khôi phục | Owner |
| `DELETE` | `/api/services/{id}/force` | Xóa vĩnh viễn | Owner |
| `GET`    | `/api/orgs/{id}/services` | Danh sách dịch vụ theo Org | Owner, Manager |

---

## Room Service (Dịch vụ theo phòng) Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/rooms/{room}/services` | Dịch vụ đăng ký của phòng | Owner, Manager, Staff |
| `POST`   | `/api/rooms/{room}/services` | Gắn dịch vụ vào phòng | Owner, Manager |
| `GET`    | `/api/rooms/{room}/services/{id}` | Chi tiết dịch vụ phòng | Owner, Manager, Staff |
| `PUT`    | `/api/rooms/{room}/services/{id}` | Cập nhật giá/gói dịch vụ phòng | Owner, Manager |
| `DELETE` | `/api/rooms/{room}/services/{id}` | Gỡ dịch vụ khỏi phòng | Owner, Manager |

---

## Cấu trúc DB

### `services`
| Field | Mô tả |
|-------|-------|
| `org_id` | Tổ chức |
| `name` | Tên dịch vụ |
| `unit` | Đơn vị tính (kWh, m³, lần, ...) |
| `billing_type` | `FIXED` hoặc `PER_UNIT` |
| `default_price` | Giá mặc định |

### `service_rates` (Bảng giá theo giai đoạn)
| Field | Mô tả |
|-------|-------|
| `service_id` | Dịch vụ |
| `price` | Giá áp dụng |
| `effective_from` | Ngày bắt đầu áp dụng |

### `room_services` (Dịch vụ đăng ký theo phòng)
| Field | Mô tả |
|-------|-------|
| `room_id` | Phòng |
| `service_id` | Dịch vụ |
| `custom_price` | Giá riêng (override default_price) |
| `status` | ACTIVE / INACTIVE |

---

## Phân quyền RBAC

| Hành động | Owner | Manager | Staff | Tenant |
|-----------|-------|---------|-------|--------|
| CRUD Service | ✅ | ❌ | ❌ | ❌ |
| Attach Service to Room | ✅ | ✅ | ❌ | ❌ |
| View Services | ✅ | ✅ | ✅ | ❌ |
