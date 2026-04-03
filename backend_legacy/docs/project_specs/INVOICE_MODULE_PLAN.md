# Kế hoạch Triển khai Tính năng Quản lý Hóa đơn (Invoice Module CRUD)

Module **Invoice** là trung tâm tài chính của hệ thống, xử lý việc gom các khoản phí (tiền thuê, điện, nước, dịch vụ) thành một hóa đơn tổng hợp hàng tháng cho từng phòng/hợp đồng.

## 1. Nền tảng Cơ sở Dữ liệu (Đã hoàn thiện)

### Bảng liên quan trực tiếp
- `invoices`: Chứa thông tin tổng quan hóa đơn (Kỳ thanh toán, Ngày hạn, Trạng thái DRAFT/PENDING/PAID/CANCELLED, Tổng tiền, Số tiền đã trả).
- `invoice_items`: Chứa chi tiết từng dòng tính tiền (Tiền phòng, Tiền điện, Tiền nước, Phí dịch vụ...).

### Bảng liên kết (Relations)
- `contracts` (Hợp đồng): Hóa đơn luôn gắn với 1 Hợp đồng thuê.
- `rooms` (Phòng): Hóa đơn gắn liền với 1 Phòng cụ thể (từ Hợp đồng).
- `properties` (Tòa nhà): Phòng thuộc Tòa nhà.
- `floors` (Tầng): Phòng có thể thuộc Tầng.
- `users`: Người tạo (`created_by_user_id`), Người phát hành (`issued_by_user_id`).

---

## 2. Thiết kế API Endpoints (RESTful chuẩn hóa)

### Danh sách APIs
cccccccc

---

## 3. Cấu trúc Xử lý Danh sách (Index)

Tương tự Meter, Invoice cần hỗ trợ lọc cực mạnh theo cây phân cấp tòa nhà, tháng, năm, và trạng thái thanh toán.

### Các tham số URL Query (Spatie QueryBuilder)
- **Tìm kiếm `?search=...`**: Search theo mã phòng hoặc tên khách hàng (nếu có eager load).
- **Lọc theo thuộc tính hóa đơn**:
  - `?filter[status]=PENDING` (DRAFT, PENDING, PAID, PARTIAL, CANCELLED)
  - `?filter[period_start]=2026-02-01` (Lọc theo kỳ)
- **Lọc Mở rộng (Cây phân cấp nhà):** Sử dụng `AllowedFilter::exact()` kết hợp `whereHas`.
  - `?filter[room_id]=xxx`: Hóa đơn của 1 phòng.
  - Tích hợp 2 endpoint riêng: Lấy theo Tòa nhà (`indexByProperty`) và Tầng (`indexByFloor`).
- **Sắp xếp (`?sort=...`):**
  - Mặc định: `-due_date` (Sắp đến hạn ưu tiên lên đầu).
  - Hỗ trợ: `period_start`, `total_amount`, `status`, `created_at`.
- **Eager Loading (`?include=...`)**: `room`, `room.property`, `contract`, `items` (chi tiết phí).

### 4. Dữ liệu Gửi lên (Request Struct)

**Tạo Hóa Đơn (POST `/api/invoices`)** - Hỗ trợ gom tạo luôn danh sách Items
```json
{
  "contract_id": "c1d2e3f4-...",
  "room_id": "5a6b7c8d-...",
  "period_start": "2026-02-01",
  "period_end": "2026-02-28",
  "due_date": "2026-03-05",
  "status": "DRAFT",
  "items": [
    {
      "type": "RENT",
      "description": "Tiền thuê tháng 2",
      "amount": 5000000
    },
    {
      "type": "SERVICE",
      "service_id": "9x8y7z...",
      "description": "Tiền điện (Chỉ số: 100 - 200)",
      "quantity": 100,
      "unit_price": 3500,
      "amount": 350000
    }
  ]
}
```

**Cập nhật Trạng thái Hóa đơn (PUT `/api/invoices/{id}`)**
```json
{
  "status": "PAID",
  "paid_amount": 5350000
}
```

### 5. Dữ liệu Trả về (Response Struct)

Sử dụng `InvoiceResource` bao bọc `InvoiceItemResource`.
```json
{
  "data": [
    {
      "id": "inv-123",
      "status": "PENDING",
      "period_start": "2026-02-01",
      "period_end": "2026-02-28",
      "due_date": "2026-03-05",
      "total_amount": 5350000,
      "paid_amount": 0,
      "room": {
        "id": "room-123",
        "name": "Phòng 101",
        "property": {
          "id": "prop-123",
          "name": "Bình Thạnh Tower"
        }
      },
      "items": [
        {
          "id": "item-1",
          "type": "RENT",
          "description": "Tiền thuê tháng 2",
          "quantity": 1,
          "unit_price": 5000000,
          "amount": 5000000
        },
        {
          "id": "item-2",
          "type": "SERVICE",
          "description": "Tiền điện",
          "quantity": 100,
          "unit_price": 3500,
          "amount": 350000
        }
      ]
    }
  ],
  "links": { ... },
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 65
  }
}
```

---

## 6. Lộ trình Triển khai Code (To-Do List)

1. **Khởi tạo Files**:
   - `app/Services/Invoice/InvoiceService.php`
   - `app/Policies/Invoice/InvoicePolicy.php`
   - `app/Http/Requests/Invoice/InvoiceStoreRequest.php`
   - `app/Http/Requests/Invoice/InvoiceUpdateRequest.php`
   - `app/Http/Resources/Invoice/InvoiceResource.php`
   - `app/Http/Resources/Invoice/InvoiceItemResource.php`
   - `app/Http/Controllers/Api/Invoice/InvoiceController.php`

2. **Cấu hình Policy (`InvoicePolicy.php`)**:
   - Áp dụng `RbacModuleProvider`.
   - Setup `Rule`: Owner/Manager `CRUD`, Staff `R`, Tenant `R` (Kết hợp kiểm tra `$invoice->contract->tenant_id === $auth_id` để Tenant chỉ thấy hóa đơn của chính mình).

3. **Cấu hình Service (`InvoiceService.php`)**:
   - Sử dụng DB Transaction khi `create` hóa đơn kèm `items`.
   - Custom Filters bằng Spatie giống Meter để có thể lọc xuyên Room -> Floor -> Property.

4. **Khai báo Route List (`routes/api.php`)**:
   ```php
   // Danh sách Hóa đơn theo cây phân cấp Tòa nhà -> Tầng
   Route::get('properties/{property_id}/invoices', [InvoiceController::class, 'indexByProperty']);
   Route::get('properties/{property_id}/floors/{floor_id}/invoices', [InvoiceController::class, 'indexByFloor']);
   
   // CRUD cơ bản
   Route::apiResource('invoices', InvoiceController::class);
   
   // CRUD cho Items trong Hóa đơn
   Route::post('invoices/{invoice}/items', [InvoiceController::class, 'storeItem']);
   Route::delete('invoices/items/{item}', [InvoiceController::class, 'destroyItem']);
   ```

5. **Đồng bộ Quyền hạn (Sync RBAC)**:
   - Cuối cùng chạy `php artisan rbac:sync` cập nhật Roles.
