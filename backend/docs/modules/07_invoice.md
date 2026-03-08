# Module: Hóa đơn (Invoice)

## Tổng quan
Module quản lý hóa đơn thuê phòng theo kỳ, bao gồm tạo hóa đơn, quản lý items, điều chỉnh hóa đơn sai và theo dõi lịch sử trạng thái.

**Controllers:**
- `App\Http\Controllers\Api\Invoice\InvoiceController`

**Services:**
- `App\Services\Invoice\InvoiceService`

**Policy:**
- `App\Policies\Invoice\InvoicePolicy`

---

## Invoice Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/invoices` | Danh sách hóa đơn | Owner, Manager, Staff, Tenant* |
| `POST`   | `/api/invoices` | Tạo hóa đơn mới (thường là DRAFT) | Owner, Manager |
| `GET`    | `/api/invoices/{id}` | Chi tiết hóa đơn | Owner, Manager, Staff, Tenant* |
| `PUT`    | `/api/invoices/{id}` | Cập nhật thông tin | Owner, Manager |
| `DELETE` | `/api/invoices/{id}` | Soft delete | Owner |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Quản lý hóa đơn (Admin Panel)**:
    - Danh sách hóa đơn kèm trạng thái (Draft, Sent, Paid, Overdue).
    - Bộ lọc theo Tòa nhà, Phòng, Trạng thái thanh toán.
    - Chức năng "Gửi hóa đơn" (Chuyển từ DRAFT -> SENT).
- [ ] **Quản lý Items & Điều chỉnh**:
    - Sửa/Xóa các Item trong hóa đơn (chỉ khi còn ở trạng thái DRAFT).
    - Nút "Thêm khoản phí" (Manual item addition).
    - Giao diện tạo "Yêu cầu chiết khấu/Phụ phí" (Invoice Adjustment).
- [ ] **Trang hóa đơn của tôi (Tenant App)**:
    - Danh sách hóa đơn của phòng đang thuê.
    - Hiển thị QR Code thanh toán (nếu có tích hợp).
    - Nút "Xem chi tiết/Tải PDF".

### 2. Query Parameters (Filters & Search)
*Endpoint: `GET /api/invoices`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `search` | string | Tìm theo mã hóa đơn, ghi chú |
| `filter[status]` | string | `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `CANCELLED` |
| `filter[property_id]` | uuid | Lọc hóa đơn theo tòa nhà |
| `filter[room_id]` | uuid | Lọc hóa đơn theo phòng |
| `sort` | string | `due_date`, `total_amount`, `created_at` |
| `page`, `per_page` | int | Chuẩn phân trang |

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/invoices/{id}/items`**
```json
{
  "description": "Phụ phí vệ sinh hành lang",
  "quantity": 1,
  "unit_price": 50000,
  "service_id": null
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/invoices`**
```json
{
  "data": [
    {
      "id": "...",
      "status": "SENT",
      "total_amount": 5450000.0,
      "paid_amount": 0.0,
      "debt": 5450000.0,
      "period_start": "2024-03-01",
      "period_end": "2024-03-31",
      "due_date": "2024-04-05",
      "room": { "code": "R101" }
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
    "last_page": 1,
    "per_page": 15,
    "total": 12
  }
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

| Role | Chức năng hiển thị | Ghi chú |
|------|--------------------|---------|
| **Owner** | Full Access & Delete | Xóa hóa đơn sai |
| **Manager** | CRUD, Send Invoice | Chốt hóa đơn gửi khách |
| **Staff** | View, Update Paid Status | Đánh dấu khách đã trả tiền |
| **Tenant** | View & Pay | Chỉ thấy hóa đơn PENDING/SENT/PAID của mình |

---

## Invoice Items & Adjustments

| Method | Endpoint | Chức năng | Role |
|--------|----------|-----------|------|
| `POST` | `/api/invoices/{id}/items` | Thêm khoản phí mới | Owner, Manager |
| `DELETE` | `/api/invoices/items/{item_id}` | Gỡ khoản phí | Owner, Manager |

---

## Phân quyền RBAC (Backend Policy)

| Hành động | Owner | Manager | Staff | Tenant |
|-----------|-------|---------|-------|--------|
| Create Invoice | ✅ | ✅ | ❌ | ❌ |
| View Invoices | ✅ | ✅ | ✅ | 🔶 own |
| Update Invoice | ✅ | ✅ | ❌ | ❌ |
| Delete Invoice | ✅ | ❌ | ❌ | ❌ |
| Add/Remove Items | ✅ | ✅ | ❌ | ❌ |
