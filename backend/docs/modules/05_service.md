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
| `POST`   | `/api/services` | Tạo dịch vụ mới (kèm bảng giá ban đầu) | Owner |
| `GET`    | `/api/services/{id}` | Chi tiết dịch vụ (kèm lịch sử giá) | Owner, Manager, Staff |
| `PUT`    | `/api/services/{id}` | Cập nhật thông tin/cập nhật giá mới | Owner, Manager |
| `DELETE` | `/api/services/{id}` | Soft delete | Owner |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Quản lý danh mục dịch vụ**:
    - Hiển thị danh sách dịch vụ: Tên, Đơn vị, Cách tính (`FIXED`, `PER_UNIT`, `PER_METER`).
    - Nút "Cập nhật giá": Mở modal nhập giá mới và ngày áp dụng (`effective_from`).
- [ ] **Cấu hình giá lũy tiến (Tiered Pricing)**:
    - Nếu `calc_mode = PER_METER` (VD: Điện, Nước), hiển thị giao diện thêm các bậc giá (Tier).
- [ ] **Gán dịch vụ vào phòng**:
    - Trong trang chi tiết Phòng, hiển thị danh sách dịch vụ đã gán hoặc chưa gán.
    - Cho phép gán dịch vụ mới hoặc gỡ bỏ.
    - Cho phép nhập giá tùy chỉnh (`custom_price`) cho riêng phòng đó.

### 2. Query Parameters (Filters & Search)
*Endpoint: `GET /api/services`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `search` | string | Tìm theo tên dịch vụ hoặc mã |
| `filter[calc_mode]` | string | `FIXED`, `PER_UNIT`, `PER_METER` |
| `filter[is_active]` | boolean | `true`/`false` |
| `sort` | string | `name`, `created_at` |
| `page`, `per_page` | int | Chuẩn phân trang |

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/services`**
```json
{
  "code": "ELEC_01",
  "name": "Điện sinh hoạt",
  "unit": "kWh",
  "calc_mode": "PER_METER",
  "is_recurring": true,
  "is_active": true,
  "price": 3500,
  "tiered_rates": [
    { "tier_from": 0, "tier_to": 50, "price": 1800 },
    { "tier_from": 51, "tier_to": null, "price": 2500 }
  ]
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/services/{id}`**
```json
{
  "data": {
    "id": "...",
    "name": "Điện sinh hoạt",
    "calc_mode": "PER_METER",
    "unit": "kWh",
    "price": 3500.0,
    "tiered_rates": [
      { "tier_from": 0, "tier_to": 50, "price": 1800.0 },
      { "tier_from": 51, "tier_to": null, "price": 2500.0 }
    ],
    "is_active": true
  },
  "links": { "self": "..." }
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

| Role | Chức năng hiển thị | Ghi chú |
|------|--------------------|---------|
| **Owner** | Full CRUD Services | Có thể thay đổi cấu hình gốc của dịch vụ |
| **Manager** | View, Attach to Room | Có thể gán dịch vụ cho phòng nhưng hạn chế sửa cấu hình gốc |
| **Staff** | View Only | Chỉ xem danh sách và giá áp dụng |
| **Tenant** | View Only | Chỉ thấy dịch vụ trong hóa đơn (không có API trực tiếp xem danh mục) |

---

## Module Feature Matrix

| Feature | `services.index` | `rooms.services.index` |
|---------|------------------|------------------------|
| Searching | ✅ | ❌ |
| Filtering | ✅ | ✅ |
| Sorting | ✅ | ❌ |
| Pagination | ✅ | ✅ |

---

## Room Service (Dịch vụ theo phòng) Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/rooms/{room}/services` | Dịch vụ đăng ký của phòng | Owner, Manager, Staff |
| `POST`   | `/api/rooms/{room}/services` | Gán dịch vụ vào phòng | Owner, Manager |
| `PUT`    | `/api/rooms/{room}/services/{id}` | Cập nhật giá/gói dịch vụ phòng | Owner, Manager |
| `DELETE` | `/api/rooms/{room}/services/{id}` | Gỡ dịch vụ khỏi phòng | Owner, Manager |

---

## Phân quyền RBAC (Backend Policy)

| Hành động | Owner | Manager | Staff | Tenant |
|-----------|-------|---------|-------|--------|
| CRUD Service | ✅ | ❌ | ❌ | ❌ |
| Attach Service to Room | ✅ | ✅ | ❌ | ❌ |
| View Services | ✅ | ✅ | ✅ | ❌ |
