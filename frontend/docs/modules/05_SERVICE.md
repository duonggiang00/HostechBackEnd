# Module: Dịch vụ (Service)

## Tổng quan
Module quản lý các loại dịch vụ đi kèm khi thuê phòng (Điện, Nước, Wifi, Gửi xe,...) và cách tính giá cho từng loại.

**Controllers:**
- `App\Http\Controllers\Api\Service\ServiceController`
- `App\Http\Controllers\Api\Service\RoomServiceController`

**Services:**
- `App\Services\Service\ServiceManager`

**Policies:**
- `App\Policies\Service\ServicePolicy`
- `App\Policies\Service\RoomServicePolicy`

---

## Service Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/services` | Danh mục dịch vụ Org | Owner, Manager, Staff |
| `POST`   | `/api/services` | Tạo dịch vụ mới | Owner |
| `PUT`    | `/api/services/{id}` | Cập nhật dịch vụ | Owner, Manager |
| `DELETE` | `/api/services/{id}` | Xóa dịch vụ | Owner |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Quản lý Danh mục Dịch vụ (Org Level)**:
    - Form tạo dịch vụ: Tên, Đơn vị tính (m3, kwh, tháng), Loại tính giá (`FIXED`, `PER_UNIT`, `PER_METER`).
    - Thiết lập Giá mặc định.
- [ ] **Gán Dịch vụ cho Phòng (Room Level)**:
    - Giao diện chọn dịch vụ từ danh mục để áp dụng cho từng phòng cụ thể.
    - Chức năng "Ghi đè giá" (`custom_price`): Cho phép đặt giá riêng cho một phòng cụ thể khác với giá chung của Org.
- [ ] **Cấu hình Giá lũy tiến (Tiered Pricing)**:
    - (Dành cho Điện/Nước) Giao diện nhập các bậc giá (VD: 50 số đầu giá X, số tiếp theo giá Y).

### 2. Các loại tính giá (Calc Modes)
Frontend cần xử lý giao diện nhập liệu khác nhau tùy theo `calc_mode`:
- **`FIXED`**: Chỉ nhập giá tổng (VD: Wifi 100k/tháng).
- **`PER_UNIT`**: Nhập đơn giá x Số lượng (VD: Nước 20k/người).
- **`PER_METER`**: Tính dựa trên chỉ số đồng hồ (Cần kết nối với module Meter).

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/rooms/{room_id}/services`**
```json
{
  "service_id": "uuid-service-electricity",
  "custom_price": 4000,
  "start_date": "2024-03-01",
  "meter_id": "uuid-meter-123"
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/services`**
```json
{
  "data": [
    {
      "id": "...",
      "name": "Điện",
      "unit": "kWh",
      "calc_mode": "PER_METER",
      "base_price": 3500.0
    }
  ]
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

- **Owner**: Có toàn quyền cấu hình bảng giá gốc.
- **Manager**: Có quyền gán dịch vụ vào phòng và điều chỉnh `custom_price` cho khách thuê.
- **Tenant**: Chỉ xem được danh sách dịch vụ đang sử dụng và đơn giá trong trang chi tiết phòng hoặc hóa đơn.

---

## Room Service Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/rooms/{room}/services` | Dịch vụ của một phòng | Owner, Manager, Staff, Tenant* |
| `POST`   | `/api/rooms/{room}/services` | Gán dịch vụ cho phòng | Owner, Manager |
| `DELETE` | `/api/rooms/{room}/services/{id}` | Gỡ dịch vụ khỏi phòng | Owner, Manager |
