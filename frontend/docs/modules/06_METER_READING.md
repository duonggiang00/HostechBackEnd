# Module: Đồng hồ & Chỉ số (Meter & Reading)

## Tổng quan
Module quản lý hệ thống đồng hồ đo đếm (Điện, Nước) và ghi nhận chỉ số tiêu thụ định kỳ để tính hóa đơn.

**Controllers:**
- `App\Http\Controllers\Api\Meter\MeterController`
- `App\Http\Controllers\Api\Meter\MeterReadingController`

**Services:**
- `App\Services\Meter\MeterService`

**Policies:**
- `App\Policies\Meter\MeterPolicy`
- `App\Policies\Meter\MeterReadingPolicy`

---

## Meter Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/meters` | Danh sách đồng hồ | Owner, Manager, Staff, Tenant* |
| `POST`   | `/api/meters` | Tạo mới đồng hồ | Owner, Manager |
| `DELETE` | `/api/meters/{id}` | Xóa đồng hồ | Owner |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Quản lý thiết bị (Meter Management)**:
    - Danh sách đồng hồ kèm mã số, loại (Điện/Nước) và vị trí (Phòng nào).
    - Trạng thái đồng hồ: `Active`, `Maintenance`, `Broken`.
- [ ] **Ghi chỉ số (Meter Reading)**:
    - Form nhập chỉ số: Chọn phòng -> Hệ thống tự gợi ý chỉ số cũ -> Nhập chỉ số mới.
    - **Tính toán nhanh**: Hiển thị ngay số lượng tiêu thụ (Mới - Cũ) để Staff kiểm tra tính hợp lý.
    - Upload ảnh chụp đồng hồ (Media) để làm minh chứng khi có khiếu nại.
- [ ] **Điều chỉnh chỉ số (Adjustment Flow)**:
    - Gửi yêu cầu điều chỉnh nếu Staff nhập sai.
    - Giao diện cho Manager phê duyệt yêu cầu điều chỉnh.

### 2. Query Parameters (Filters & Search)
*Endpoint: `GET /api/meters`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `filter[type]` | string | `ELECTRICITY`, `WATER` |
| `filter[room_id]` | uuid | Lọc đồng hồ theo phòng |

*Endpoint: `GET /api/meter-readings`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `filter[meter_id]` | uuid | Xem lịch sử ghi số của 1 đồng hồ |
| `filter[reading_date]` | date | Lọc theo ngày ghi |

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/meters/{id}/readings`**
```json
{
  "reading_value": 1250,
  "reading_date": "2024-03-01",
  "media_uuids": ["uuid-image-1"]
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/meter-readings`**
```json
{
  "data": [
    {
      "id": "...",
      "old_value": 1200,
      "new_value": 1250,
      "usage": 50,
      "reading_date": "2024-03-01",
      "meter": { "type": "ELECTRICITY" }
    }
  ]
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

- **Staff**: Có quyền truy cập Form "Ghi số" và xem danh sách chỉ số cũ.
- **Tenant**: Xem được chỉ số và ảnh chụp minh chứng của phòng mình để đối soát.
- **Manager**: Phê duyệt hoặc từ chối các phiếu điều chỉnh chỉ số (`Adjustment Note`).

---

## Meter Reading Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/meter-readings` | Lịch sử ghi số | Owner, Manager, Staff, Tenant* |
| `POST`   | `/api/meters/{id}/readings` | Nhập chỉ số mới | Owner, Manager, Staff |
| `PUT`    | `/api/meter-readings/{id}/adjustments/approve` | Duyệt điều chỉnh | Owner, Manager |
