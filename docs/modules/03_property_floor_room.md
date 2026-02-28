# Module: Bất động sản (Property, Floor, Room)

## Tổng quan
Module quản lý tài sản cho thuê bao gồm Tòa nhà (Property), Tầng (Floor) và Phòng (Room). Đây là lớp dữ liệu trung tâm của hệ thống.

**Controllers:**
- `App\Http\Controllers\Api\Property\PropertyController`
- `App\Http\Controllers\Api\Property\FloorController`
- `App\Http\Controllers\Api\Property\RoomController`
- `App\Http\Controllers\Api\Property\RoomAssetController`

**Services:**
- `App\Services\Property\PropertyService`
- `App\Services\Property\RoomService`

**Policies:**
- `App\Policies\Property\PropertyPolicy`
- `App\Policies\Property\RoomPolicy`

---

## Property Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/properties` | Danh sách tòa nhà | Owner, Manager, Staff, Tenant* |
| `POST`   | `/api/properties` | Tạo tòa nhà mới | Owner |
| `GET`    | `/api/properties/{id}` | Chi tiết tòa nhà | Owner, Manager, Staff, Tenant* |
| `PUT`    | `/api/properties/{id}` | Cập nhật tòa nhà | Owner, Manager |
| `DELETE` | `/api/properties/{id}` | Soft delete | Owner |
| `GET`    | `/api/properties/trash` | Thùng rác | Owner |
| `POST`   | `/api/properties/{id}/restore` | Khôi phục | Owner |
| `DELETE` | `/api/properties/{id}/force` | Xóa vĩnh viễn | Owner |

> ⚠️ Tenant*: Chỉ thấy tòa nhà họ đang có hợp đồng ACTIVE+APPROVED (scope qua PropertyPolicy.view() và PropertyService.paginate())

---

## Floor Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/floors` | Danh sách tầng | Owner, Manager, Staff |
| `POST`   | `/api/floors` | Tạo tầng | Owner, Manager |
| `GET`    | `/api/floors/{id}` | Chi tiết tầng | Owner, Manager, Staff |
| `PUT`    | `/api/floors/{id}` | Cập nhật tầng | Owner, Manager |
| `DELETE` | `/api/floors/{id}` | Soft delete | Owner |
| `GET`    | `/api/floors/trash` | Thùng rác | Owner |
| `POST`   | `/api/floors/{id}/restore` | Khôi phục | Owner |
| `DELETE` | `/api/floors/{id}/force` | Xóa vĩnh viễn | Owner |
| `GET`    | `/api/properties/{id}/floors` | Tầng theo tòa nhà (nested) | Owner, Manager |

---

## Room Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/rooms` | Danh sách phòng | Owner, Manager, Staff, Tenant* |
| `POST`   | `/api/rooms` | Tạo phòng mới | Owner, Manager |
| `GET`    | `/api/rooms/{id}` | Chi tiết phòng | Owner, Manager, Staff, Tenant* |
| `PUT`    | `/api/rooms/{id}` | Cập nhật phòng | Owner, Manager |
| `DELETE` | `/api/rooms/{id}` | Soft delete | Owner |
| `GET`    | `/api/rooms/trash` | Thùng rác | Owner |
| `POST`   | `/api/rooms/{id}/restore` | Khôi phục | Owner |
| `DELETE` | `/api/rooms/{id}/force` | Xóa vĩnh viễn | Owner |
| `GET`    | `/api/properties/{id}/rooms` | Phòng theo tòa nhà (nested) | Owner, Manager |

> ⚠️ Tenant*: RoomService.paginate() và RoomPolicy.view() đều yêu cầu Contract ACTIVE + APPROVED membership

---

## Room Asset Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/properties/{p}/rooms/{r}/assets` | Danh sách tài sản trong phòng | Owner, Manager, Staff |
| `POST`   | `/api/properties/{p}/rooms/{r}/assets` | Thêm tài sản | Owner, Manager |
| `GET`    | `/api/properties/{p}/rooms/{r}/assets/{id}` | Chi tiết tài sản | All |
| `PUT`    | `/api/properties/{p}/rooms/{r}/assets/{id}` | Cập nhật | Owner, Manager |
| `DELETE` | `/api/properties/{p}/rooms/{r}/assets/{id}` | Xóa | Owner |

---

## Cấu trúc Query Params (Danh sách Phòng)

```
GET /api/rooms?filter[property_id]=uuid&filter[status]=AVAILABLE&filter[type]=APARTMENT&search=101&per_page=20
```

| Param | Mô tả |
|-------|-------|
| `filter[property_id]` | Lọc theo tòa nhà |
| `filter[floor_id]` | Lọc theo tầng |
| `filter[status]` | `AVAILABLE`, `OCCUPIED`, `MAINTENANCE` |
| `filter[type]` | Loại phòng (APARTMENT, STUDIO, ...) |
| `search` | Tìm theo tên/mã phòng |
| `include` | `assets`, `prices`, `statusHistories`, `media` |

---

## Tenant Scoping Logic

```
Tenant → gọi GET /api/rooms
     → RoomPolicy.viewAny() → check permission 'viewAny Room' ✅
     → RoomService.paginate() → whereHas('contracts', status=ACTIVE)
                               .whereHas('members', user_id=me, status=APPROVED)
     → Kết quả: chỉ phòng của mình (hoặc [] nếu chưa có hợp đồng)
```

---

## Phân quyền RBAC

| Hành động | Admin | Owner | Manager | Staff | Tenant |
|-----------|-------|-------|---------|-------|--------|
| viewAny | ✅ | ✅ | ✅ | ✅ | 🔶 scoped |
| view | ✅ | ✅ | ✅ | ✅ | 🔶 own room |
| create | ✅ | ✅ | ✅ | ❌ | ❌ |
| update | ✅ | ✅ | ✅ | 🔶 limited | ❌ |
| delete | ✅ | ✅ | ❌ | ❌ | ❌ |
