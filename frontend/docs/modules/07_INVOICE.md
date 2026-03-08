# Module: Hóa đơn (Invoice)

## Tổng quan
Module quản lý các khoản phí, xuất hóa đơn hàng tháng và theo dõi trạng thái thanh toán của khách thuê.

**Controllers:**
- `App\Http\Controllers\Api\Invoice\InvoiceController`
- `App\Http\Controllers\Api\Invoice\InvoiceItemController`

**Services:**
- `App\Services\Invoice\InvoiceService`

**Policies:**
- `App\Policies\Invoice\InvoicePolicy`

---

## Invoice Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/invoices` | Danh sách hóa đơn | Owner, Manager, Staff, Tenant* |
| `POST`   | `/api/invoices` | Tạo hóa đơn nháp | Owner, Manager |
| `GET`    | `/api/invoices/{id}` | Chi tiết hóa đơn | Owner, Manager, Staff, Tenant* |
| `PUT`    | `/api/invoices/{id}` | Cập nhật thông tin/ghi chú | Owner, Manager |
| `DELETE` | `/api/invoices/{id}` | Soft delete | Owner |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Quản lý Hóa đơn (Quản lý)**:
    - Danh sách hóa đơn tập trung hoặc theo phân cấp (Tòa nhà -> Tầng -> Phòng).
    - Bộ lọc trạng thái: `DRAFT`, `SENT`, `PAID`, `OVERDUE`.
    - Chốt hóa đơn: Chuyển từ `DRAFT` sang `SENT` để gửi thông báo cho khách.
    - Ghi nhận thanh toán (`Log Payment`): Đánh dấu hóa đơn đã được thanh toán.
- [ ] **Xem & Thanh toán (Khách thuê)**:
    - Hiển thị danh sách hóa đơn `SENT` và `PAID`.
    - Xem chi tiết từng khoản mục (Tiền phòng, Điện, Nước, Dịch vụ khác).
    - Tích hợp QR Code thanh toán (Chức năng tạo ảnh QR dựa trên STK và số tiền).
- [ ] **Điều chỉnh hóa đơn (Adjustments)**:
    - Thêm/Sửa/Xóa các Item trong hóa đơn nháp.
    - Quản lý các phiếu giảm trừ hoặc phụ phí phát sinh.

### 2. Query Parameters (Filters & Search)
*Endpoint: `GET /api/invoices`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `filter[status]` | string | `DRAFT`, `SENT`, `PAID`, `CANCELLED` |
| `filter[room_id]` | uuid | Lọc hóa đơn theo phòng |
| `filter[month]` | string | Lọc theo tháng (VD: `2024-03`) |

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/invoices/{id}/items` (Thêm khoản mục)**
```json
{
  "description": "Phí vệ sinh hành lang tháng 3",
  "amount": 50000,
  "quantity": 1
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/invoices`**
```json
{
  "data": [
    {
      "id": "...",
      "invoice_number": "INV-101-0324",
      "total_amount": 5650000.0,
      "status": "SENT",
      "due_date": "2024-03-05",
      "room": { "room_number": "101" }
    }
  ]
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

- **Tenant**: Chỉ thấy các hóa đơn thuộc phòng mình và ở trạng thái không phải `DRAFT`.
- **Manager**: Quản lý toàn bộ luồng hóa đơn của tòa nhà.
- **Owner**: Có quyền xóa hoặc điều chỉnh các hóa đơn đã chốt.

---

## Status Flow
`DRAFT` (Nháp) -> `SENT` (Đã gửi khách) -> `PAID` (Đã thanh toán) / `OVERDUE` (Quá hạn)
