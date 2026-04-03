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
    - Hiển thị Lịch sử giá (Price History) và Lịch sử trạng thái (Status History - Đã hỗ trợ ở tầng API `status_histories` trong `RoomResource`).
    - Tab hiển thị Media (Hình ảnh phòng).
- [ ] **Form Tạo/Cập nhật**:
    - Validate các trường bắt buộc: Tòa nhà, Mã phòng, Tên phòng, Giá cơ bản.
    - **Lưu ý**: Sử dụng trường `floor_number` cho số tầng (thay vì `floor` cũ).
    - Tích hợp thêm/sửa/xóa Assets ngay trong form (Nested attributes).

### 2. Dữ liệu gửi lên (Request Example)
- [ ] **Sơ đồ tòa nhà (Property Hierarchy)**:
    - Hiển thị danh sách tòa nhà dưới dạng Card hoặc Table.
    - Click vào tòa nhà -> Hiện danh sách tầng (Floor).
    - Click vào tầng -> Hiện danh sách phòng (Room).
- [ ] **Quản lý phòng (Room Management)**:
    - Form tạo phòng: Thuộc tầng nào, diện tích, giá thuê, số lượng giường.
    - Trạng thái phòng: Visual hóa màu sắc theo trạng thái (Available, Occupied, Maintenance).
- [ ] **Bộ lọc & Tìm kiếm**:
    - Tìm kiếm phòng theo mã phòng hoặc tên khách thuê.
    - Lọc phòng theo khoảng giá, diện tích, hoặc tiện ích đi kèm.

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

## 🔐 Phân quyền RBAC Backend & Yêu cầu Frontend

Hệ thống Quản lý Bất động sản (Property, Floor, Room) tuân thủ mô hình bảo mật Scope-based nghiêm ngặt nhằm tránh thất thoát dữ liệu giữa các Tòa nhà và giữa các Khách thuê.

### 1. Ma trận phân quyền Backend (Policies)

| Hành động | Owner | Manager | Staff | Tenant |
|-----------|:---:|:---:|:---:|:---:|
| **Properties** (Tòa nhà) |
| Xem danh sách | ✅ (All in Org) | ✅ (Assigned only) | ✅ (Assigned only) | ✅ (Rented only) |
| Cập nhật | ✅ | ✅ (Assigned only) | ❌ | ❌ |
| **Floors** (Tầng) |
| Xem danh sách | ✅ (All in Org) | ✅ (Assigned only) | ✅ (Assigned only) | ❌ |
| Tạo / Cập nhật | ✅ | ✅ (Assigned only) | ❌ | ❌ |
| **Rooms** (Phòng) |
| Xem danh sách | ✅ (All in Org) | ✅ (Assigned only) | ✅ (Assigned only) | ✅ (Rented only) |
| Cập nhật | ✅ | ✅ (Assigned only) | ✅ (Assigned only) | ❌ |

### 2. Logic Bảo mật Scope (Backend Enforcements)

- **Manager / Staff Scope (`HandlesPropertyScope`)**: Backend tự động filter danh sách (qua `whereHas('managers')` trong Service) và chặn thao tác (qua Policy). `Manager` và `Staff` **tuyệt đối không thể nhìn thấy Property, Floor, hay Room nào nằm ngoài danh sách Tòa nhà mà họ được phân công quản lý.**
- **Tenant Scope**: Tenant (Khách thuê) bị giới hạn cực kỳ chặt chẽ. Họ chỉ nhìn thấy `Property` và `Room` nếu như đang có một Hợp đồng (`Contract`) ở trạng thái `ACTIVE` tại đó. Khách thuê **không thể xem danh sách các phòng khác** trong cùng Tòa nhà. `Floor` bị ẩn hoàn toàn với Tenant.

### 3. Yêu cầu thiết kế UI/UX Frontend theo từng Role

Dựa vào quy tắc bảo mật trên, giao diện (React/Vue) cần được cấu trúc theo các nhóm quyền sau:

#### 🧑‍💻 Dành cho `Tenant` (Khách thuê)
- **Menu Navigation**: Chuyển menu "Quản lý tòa nhà" thành "Thông tin Phòng của tôi". 
- **View**: Tenant chỉ nhìn thấy duy nhất Phòng mà họ đang thuê, các thông tin liên quan tới phòng đó (tài sản bàn giao, giá thuê hiện tại). Không hiển thị sơ đồ tòa nhà dạng cây.

#### 👷 Dành cho `Staff` (Nhân viên kỹ thuật/CSKH)
- **Menu Navigation**: Hiển thị menu "Quản lý tòa nhà/phòng".
- **View**: Hiển thị danh sách Tòa nhà, Tầng, Phòng. Danh sách này mặc định đã được Backend tự động lọc (chỉ hiện các tòa nhà mà nhân viên đó làm việc).
- **Actions**:
  - Không có quyền Tạo mới Tòa nhà/Tầng/Phòng hay Xóa dòng dữ liệu.
  - Được phép Cập nhật (`U`) dữ liệu Phòng (Ví dụ: Cập nhật trạng thái phòng từ `maintenance` sang `available` sau khi dọn dẹp xong).

#### 👔 Dành cho `Manager` (Quản lý cấp trung)
- **Menu Navigation**: Hiển thị toàn bộ nhóm tính năng "Quản lý Tòa nhà".
- **View**: Tự động lọc ra các Tòa nhà mà quản lý đó phụ trách.
- **Actions**: Full quyền xem, tạo, sửa trên các Tòa nhà được phân công. (Tuy nhiên thao tác Xóa/Restore/Force Delete thường sẽ bị khóa hoặc chờ config cụ thể tùy hệ thống, hiện tại Manager không có quyền Xóa).

#### 👑 Dành cho `Owner` (Chủ nhà / Admin)
- **Menu Navigation**: Full quyền truy cập.
- **View**: Nhìn thấy toàn bộ tài sản của toàn bộ Tòa nhà trong tổ chức. Chế độ xem cây (Tree view) từ Tòa nhà -> Tầng -> Phòng hoạt động hoàn chỉnh.
- **Actions**: Có đầy đủ các nút Thêm mới, Sửa, Xóa (Soft Delete), và Khôi phục đối với bất kỳ Node nào. Mở rộng thêm tab "Thùng rác" cho các module này.
