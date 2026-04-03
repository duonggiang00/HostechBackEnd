# Module: Đồng hồ & Chỉ số (Meter & Reading)

## Tổng quan
Module quản lý các đồng hồ điện/nước/gas được gắn với phòng thuê, và theo dõi chỉ số hàng kỳ. Hỗ trợ điều chỉnh chỉ số sai với quy trình phê duyệt.

**Controllers:**
- `App\Http\Controllers\Api\Meter\MeterController`
- `App\Http\Controllers\Api\Meter\MeterReadingController`
- `App\Http\Controllers\Api\Meter\AdjustmentNoteController`

**Services:**
- `App\Services\Meter\MeterService`

**Policy:**
- `App\Policies\Meter\MeterPolicy`

---

## Meter (Đồng hồ) Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/meters` | Danh sách đồng hồ | Owner, Manager, Staff, Tenant* |
| `POST`   | `/api/meters` | Tạo đồng hồ mới | Owner, Manager |
| `GET`    | `/api/meters/{id}` | Chi tiết đồng hồ | Owner, Manager, Staff, Tenant* |
| `PUT`    | `/api/meters/{id}` | Cập nhật đồng hồ | Owner, Manager |
| `DELETE` | `/api/meters/{id}` | Xóa đồng hồ | Owner |
| `GET`    | `/api/properties/{pid}/meters` | Đồng hồ theo tòa nhà | Owner, Manager, Staff |
| `GET`    | `/api/properties/{pid}/floors/{fid}/meters` | Đồng hồ theo tầng | Owner, Manager, Staff |

> ⚠️ Tenant*: MeterService.paginate() scope theo contract ACTIVE + APPROVED membership

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Trang quản lý đồng hồ**:
    - Danh sách đồng hồ theo loại (Điện, Nước).
    - Hiển thị chỉ số cuối cùng (Last Reading).
- [ ] **Giao diện nhập chỉ số hàng kỳ**:
    - Form nhập chỉ số mới (validate: phải lớn hơn hoặc bằng chỉ số cũ).
    - Tải lên ảnh chụp thực tế đồng hồ (Media).
    - Tự động hiển thị lượng tiêu thụ (`consumption`) ngay khi nhập.
- [ ] **Trang lịch sử chỉ số & Điều chỉnh**:
    - Biểu đồ tiêu thụ (nếu cần).
    - Nút "Yêu cầu điều chỉnh" cho từng bản ghi chỉ số (nếu phát hiện sai).
    - Giao diện duyệt điều chỉnh cho Owner/Manager.

### 2. Query Parameters (Filters & Search)
*Endpoint: `GET /api/meters`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `search` | string | Tìm theo số serial đồng hồ |
| `filter[type]` | string | `ELECTRICITY`, `WATER` |
| `filter[property_id]` | uuid | Lọc theo tòa nhà |
| `filter[room_id]` | uuid | Lọc theo phòng |
| `sort` | string | `type`, `created_at` |
| `page`, `per_page` | int | Chuẩn phân trang |

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/meters/{meter}/readings`**
```json
{
  "value": 1520,
  "read_at": "2024-03-25",
  "notes": "Chốt số cuối tháng 3",
  "photos": [ /* Binary file data hoặc UUID media */ ]
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/meters`**
```json
{
  "data": [
    {
      "id": "...",
      "type": "ELECTRICITY",
      "serial_number": "SN-9921",
      "room": { "code": "R101" },
      "last_reading": {
        "value": 1450,
        "read_at": "2024-02-28"
      }
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
    "last_page": 2,
    "per_page": 15,
    "total": 24
  }
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

| Role | Chức năng hiển thị | Ghi chú |
|------|--------------------|---------|
| **Owner** | Full Access & Approve | Phê duyệt các adjustment |
| **Manager** | View, Create, Request Adjustment | Nhập liệu và yêu cầu sửa sai |
| **Staff** | View, Create Reading | Chỉ nhập liệu, không thể sửa/xóa |
| **Tenant** | View Own Meter | Theo dõi chỉ số đã chốt (không thể tự nhập) |

---

## Adjustment Flow (Luồng điều chỉnh)

| Role | Hành động | Kết quả |
|------|-----------|---------|
| **Staff/Manager** | POST `/adjustments` | Tạo Ticket/Yêu cầu điều chỉnh |
| **Owner/Manager** | PUT `.../approve` | Cập nhật giá trị `value` chính xác |

---

## Phân quyền RBAC (Backend Policy)

| Hành động | Owner | Manager | Staff | Tenant |
|-----------|-------|---------|-------|--------|
| CRUD Meter | ✅ | ✅ | ❌ | ❌ |
| Create Reading | ✅ | ✅ | ✅ | ❌ |
| View Meter/Reading | ✅ | ✅ | ✅ | 🔶 own room |
| Approve Adjustment | ✅ | ✅ | ❌ | ❌ |

---

## Meter Reading (Chỉ số kỳ) Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/meters/{meter}/readings` | Danh sách chỉ số | Owner, Manager, Staff |
| `POST`   | `/api/meters/{meter}/readings` | Nhập chỉ số mới | Owner, Manager, Staff |
| `GET`    | `/api/meters/{meter}/readings/{id}` | Chi tiết chỉ số | Owner, Manager, Staff |
| `PUT`    | `/api/meters/{meter}/readings/{id}` | Cập nhật chỉ số | Owner, Manager |
| `DELETE` | `/api/meters/{meter}/readings/{id}` | Xóa chỉ số | Owner |

---

## Adjustment Note (Điều chỉnh chỉ số sai) Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/meter-readings/{reading}/adjustments` | Danh sách yêu cầu điều chỉnh | Owner, Manager |
| `POST`   | `/api/meter-readings/{reading}/adjustments` | Tạo yêu cầu điều chỉnh | Manager, Staff |
| `PUT`    | `/api/meter-readings/{reading}/adjustments/{id}/approve` | Phê duyệt điều chỉnh | Owner, Manager |
| `PUT`    | `/api/meter-readings/{reading}/adjustments/{id}/reject` | Từ chối điều chỉnh | Owner, Manager |

---

## Adjustment Flow (Luồng điều chỉnh)

```
Staff/Manager phát hiện chỉ số sai
    → POST /meter-readings/{id}/adjustments (yêu cầu điều chỉnh)
    → Manager/Owner xem xét
    → PUT .../approve → Cập nhật reading.value + tạo invoice_adjustment
    → PUT .../reject  → Đánh dấu rejected
```

---

## Cấu trúc DB

### `meters`
| Field | Mô tả |
|-------|-------|
| `org_id`, `property_id`, `room_id` | Scope |
| `type` | ELECTRICITY / WATER / GAS / INTERNET |
| `serial_number` | Số serial đồng hồ |
| `service_id` | Liên kết dịch vụ tính phí |

### `meter_readings`
| Field | Mô tả |
|-------|-------|
| `meter_id` | Đồng hồ |
| `value` | Chỉ số hiện tại |
| `previous_value` | Chỉ số kỳ trước |
| `consumption` | Lượng tiêu thụ = value - previous |
| `read_at` | Thời điểm đọc |
| `status` | PENDING / CONFIRMED / ADJUSTED |

### `adjustment_notes`
| Field | Mô tả |
|-------|-------|
| `meter_reading_id` | Chỉ số cần điều chỉnh |
| `original_value`, `adjusted_value` | Giá trị gốc / đã điều chỉnh |
| `reason` | Lý do điều chỉnh |
| `status` | PENDING / APPROVED / REJECTED |
| `approved_by` | Người phê duyệt |

---

## Tenant Scoping

Tenant sẽ thấy Meter nếu có Contract ACTIVE + APPROVED cho phòng đó:

```php
$query->whereHas('contracts', fn($q) =>
    $q->where('status', 'ACTIVE')
      ->whereHas('members', fn($sq) =>
          $sq->where('user_id', $user->id)->where('status', 'APPROVED')
      )
);
```
