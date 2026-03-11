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

> ⚠️ Tenant*: RoomService.paginate() và RoomPolicy.view() đều yêu cầu Contract ACTIVE + APPROVED membership.

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Trang danh sách phòng**:
    - Hiển thị Grid/List các phòng.
    - Bộ lọc theo Tòa nhà (Property), Tầng (Floor), Trạng thái (Status).
    - Ô tìm kiếm theo Tên hoặc Mã phòng.
- [ ] **Trang chi tiết phòng**:
    - Hiển thị thông tin cơ bản: Diện tích, Sức chứa, Giá thuê.
    - Hiển thị danh sách Tài sản (Assets) đính kèm.
    - Hiển thị Lịch sử giá (Price History) và Lịch sử trạng thái (Status History).
    - Tab hiển thị Media (Hình ảnh phòng).
- [ ] **Form Tạo/Cập nhật**:
    - Validate các trường bắt buộc: Tòa nhà, Mã phòng, Tên phòng, Giá cơ bản.
    - **Lưu ý**: Sử dụng trường `floor_number` cho số tầng (thay vì `floor` cũ).
    - Tích hợp thêm/sửa/xóa Assets ngay trong form (Nested attributes).

### 2. Query Parameters (Filters & Search)
*Endpoint: `GET /api/properties`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `search` | string | Tìm theo tên hoặc mã tòa nhà |
| `filter[org_id]` | uuid | Bắt buộc (tự động theo scope) |
| `sort` | string | `name`, `created_at` |

*Endpoint: `GET /api/rooms`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `search` | string | Tìm theo mã phòng |
| `filter[property_id]` | uuid | Lọc theo tòa nhà |
| `filter[floor_number]` | int | Lọc theo tầng |
| `filter[status]` | string | `available`, `occupied`, `maintenance`, `reserved` |
| `sort` | string | `price`, `area`, `room_number` |
| `page`, `per_page` | int | Chuẩn phân trang |

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/rooms`**
```json
{
  "floor_id": "uuid-floor-1",
  "room_number": "101",
  "floor_number": 1,
  "area": 25.5,
  "price": 5000000,
  "status": "available",
  "amenities": ["Air Conditioner", "Wifi"]
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/rooms`**
```json
{
  "data": [
    {
      "id": "...",
      "room_number": "101",
      "floor_number": 1,
      "price": 5000000.0,
      "status": "available",
      "property": { "name": "Hostech Tower A" }
    }
  ],
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 5
  }
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

| Role | Chức năng hiển thị | Ghi chú |
|------|--------------------|---------|
| **Admin** | Full Access | |
| **Owner** | Full Access | |
| **Manager** | CRUD Properties, Floors, Rooms | |
| **Staff** | View All, Update Status | |
| **Tenant** | View Own Property/Room | |
