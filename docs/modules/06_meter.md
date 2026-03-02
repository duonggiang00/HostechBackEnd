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
