# Module: Bàn giao (Handover)

## Tổng quan
Module quản lý quy trình kiểm kê tài sản và chốt đầu vào/đầu ra khi khách `Check-in` hoặc `Check-out`.

**Controllers:**
- `App\Http\Controllers\Api\Handover\HandoverRecordController`
- `App\Http\Controllers\Api\Handover\HandoverItemController`

**Services:**
- `App\Services\Handover\HandoverService`

**Policies:**
- `App\Policies\Handover\HandoverPolicy`

---

## Handover Endpoints

| Method | Endpoint | Chức năng | Role |
|--------|----------|-----------|------|
| `GET`    | `/api/handovers` | Danh sách biên bản | Staff, Manager |
| `POST`   | `/api/handovers` | Tạo biên bản mới | Staff, Manager |
| `GET`    | `/api/handovers/{id}` | Chi tiết biên bản | All roles |
| `POST`   | `/api/handovers/{id}/confirm` | Chốt/Khóa biên bản | Manager |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Lập biên bản (Nhân viên)**:
    - Chọn hợp đồng/phòng cần bàn giao.
    - Danh sách kiểm tra (Checklist): Duyệt qua các tài sản trong phòng, tích chọn tình trạng (`GOOD`, `DAMAGED`, `MISSING`).
    - Chốt số điện/nước đầu kỳ: Nhập chỉ số và đính kèm ảnh (Liên kết với module Meter).
- [ ] **Xác nhận biên bản (Khách thuê)**:
    - Xem nội dung biên bản nhân viên đã lập.
    - Chức năng Ký xác nhận (Chụp ảnh chữ ký hoặc ký trực tiếp trên màn hình cảm ứng).
- [ ] **Lưu trữ & Xuất bản**:
    - Xuất file ảnh/PDF biên bản đã có chữ ký hai bên.
    - Khóa biên bản (Locked) để không thể sửa đổi sau khi đã Confirm.

### 2. Các trường dữ liệu chính
- `type`: `CHECK_IN` hoặc `CHECK_OUT`.
- `status`: `DRAFT`, `PENDING_CONFIRM`, `CONFIRMED`.
- `items`: Mảng các đối tượng tài sản và tình trạng.

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/handovers`**
```json
{
  "contract_id": "uuid-contract",
  "type": "CHECK_IN",
  "handover_date": "2024-03-01",
  "meter_readings": [
    {"meter_id": "uuid-1", "value": 100}
  ],
  "items": [
    {"item_name": "Điều hòa", "status": "GOOD", "note": ""},
    {"item_name": "Vòi sen", "status": "DAMAGED", "note": "Bị nứt nhẹ"}
  ]
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

- **Staff**: Người lập biên bản, có quyền sửa trong trạng thái `DRAFT`.
- **Tenant**: Chỉ thấy biên bản liên quan đến hợp đồng của mình. Thực hiện hành động "Ký xác nhận".
- **Manager**: Chốt biên bản cuối cùng (`CONFIRM`) để chính thức áp dụng dữ liệu điện nước và tài sản.
