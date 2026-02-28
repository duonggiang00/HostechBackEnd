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
| `POST`   | `/api/invoices` | Tạo hóa đơn mới | Owner, Manager |
| `GET`    | `/api/invoices/{id}` | Chi tiết hóa đơn | Owner, Manager, Staff, Tenant* |
| `PUT`    | `/api/invoices/{id}` | Cập nhật hóa đơn | Owner, Manager |
| `DELETE` | `/api/invoices/{id}` | Soft delete | Owner |
| `GET`    | `/api/invoices/trash` | Thùng rác | Owner |
| `POST`   | `/api/invoices/{id}/restore` | Khôi phục | Owner |
| `DELETE` | `/api/invoices/{id}/force` | Xóa vĩnh viễn | Owner |

---

## Invoice Timeline (Hierarchical View)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| `GET` | `/api/properties/{pid}/invoices` | Hóa đơn theo tòa nhà |
| `GET` | `/api/properties/{pid}/floors/{fid}/invoices` | Hóa đơn theo tầng |

---

## Invoice Items Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `POST`   | `/api/invoices/{invoice}/items` | Thêm item vào hóa đơn | Owner, Manager |
| `DELETE` | `/api/invoices/items/{item}` | Xóa item khỏi hóa đơn | Owner, Manager |

---

## Invoice Status Flow

```
DRAFT → SENT → PAID
              → OVERDUE → PAID (late)
              → CANCELLED
```

---

## Cấu trúc DB

### `invoices`
| Field | Mô tả |
|-------|-------|
| `org_id`, `property_id`, `room_id` | Scope |
| `contract_id` | Hợp đồng liên quan |
| `period_from`, `period_to` | Kỳ hóa đơn |
| `total_amount` | Tổng tiền |
| `status` | DRAFT / SENT / PAID / OVERDUE / CANCELLED |
| `due_date` | Hạn thanh toán |
| `note` | Ghi chú |

### `invoice_items`
| Field | Mô tả |
|-------|-------|
| `invoice_id` | Hóa đơn |
| `description` | Mô tả khoản mục |
| `quantity`, `unit_price`, `amount` | Số lượng, đơn giá, thành tiền |
| `service_id` | Dịch vụ liên quan (nếu có) |

### `invoice_status_histories`
| Field | Mô tả |
|-------|-------|
| `invoice_id` | Hóa đơn |
| `from_status`, `to_status` | Thay đổi trạng thái |
| `changed_by` | Người thay đổi |
| `note` | Lý do |
| `changed_at` | Thời điểm |

### `invoice_adjustments`
| Field | Mô tả |
|-------|-------|
| `invoice_id` | Hóa đơn |
| `adjustment_type` | CREDIT / DEBIT |
| `amount` | Số tiền điều chỉnh |
| `reason` | Lý do |
| `status` | PENDING / APPROVED / REJECTED |

---

## Tenant Scoping

Tenant chỉ thấy hóa đơn của phòng đang thuê theo contract ACTIVE + APPROVED:

```php
// InvoiceService.paginate()
if ($user->hasRole('Tenant')) {
    $query->whereHas('contract.members', fn($q) =>
        $q->where('user_id', $user->id)
          ->where('status', 'APPROVED')
    )->whereHas('contract', fn($q) =>
        $q->where('status', 'ACTIVE')
    );
}
```

---

## Phân quyền RBAC

| Hành động | Owner | Manager | Staff | Tenant |
|-----------|-------|---------|-------|--------|
| Create Invoice | ✅ | ✅ | ❌ | ❌ |
| View Invoices | ✅ | ✅ | ✅ | 🔶 own |
| Update Invoice | ✅ | ✅ | ❌ | ❌ |
| Delete Invoice | ✅ | ❌ | ❌ | ❌ |
| Add/Remove Items | ✅ | ✅ | ❌ | ❌ |
