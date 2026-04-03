# HƯỚNG DẪN KỸ THUẬT: MODULE TÀI CHÍNH (FINANCE) - MASTER BLUEPRINT

--

## 1. TIÊU CHUẨN KIẾN TRÚC & HỆ THỐNG (SYSTEM STANDARDS)

### 1.1. Common Model Traits (Bắt buộc)
Tất cả các Model trong Domain `Finance` (Payment, Allocation, Ledger, Cashflow) phải sử dụng:
- `App\Models\Concerns\MultiTenant`: Tự động scope dữ liệu theo `org_id` (Tenant isolation).
- `App\Traits\SystemLoggable`: Ghi nhận nhật ký audit (Ai làm gì, khi nào, thay đổi giá trị gì).
- `Illuminate\Database\Eloquent\Concerns\HasUuids`: Sử dụng UUID làm khóa chính.
- `Illuminate\Database\Eloquent\SoftDeletes`: Không xóa cứng, đảm bảo lịch sử tài chính.
- **Casts**: Bắt buộc sử dụng `protected function casts(): array` để định nghĩa kiểu `decimal:2` cho tiền tệ và `datetime` cho các trường thời gian.

### 1.2. RBAC & Security Scoping
- **Policy**: Implement `App\Contracts\RbacModuleProvider` để đăng ký permission với hệ thống.
- **Scoping**: Sử dụng `App\Traits\HandlesPropertyScope` (kiểm tra quyền theo `property_id`) kết hợp với `HandlesOrgScope` (kiểm tra quyền theo `org_id`).
- **Permissions**: Cần định nghĩa tối thiểu: `view payments`, `create payments`, `audit ledger`, `manage cashflow`.

### 1.3. API Documentation (Scramble)
Mọi FormRequest phải có đầy đủ annotations để Scramble sinh tài liệu chuẩn:
```php
/**
 * @bodyParam property_id uuid Required. ID tòa nhà.
 * @bodyParam amount decimal Required. Tổng tiền thu. Example: 5500000.00
 * @bodyParam allocations array Required. Danh sách hóa đơn gạch nợ.
 */
```

---

## 2. CẤU TRÚC DOMAIN (DOMAIN ARCHITECTURE)

### 2.1. Tổ chức thư mục
```text
app/
├── Models/Finance/ (Payment, PaymentAllocation, LedgerEntry, CashflowEntry)
├── Services/Finance/ 
│   ├── PaymentService (Xử lý thu tiền, gạch nợ, gọi Invoice logic)
│   ├── LedgerService (Ghi chép bút toán sổ cái đối soát)
│   └── CashflowService (Quản lý dòng tiền thực tế In/Out)
├── Http/
│   ├── Controllers/Api/Finance/ (PaymentController, CashflowController)
│   ├── Requests/Finance/ (StorePaymentRequest, IndexPaymentRequest)
│   └── Resources/Finance/ (PaymentResource, LedgerResource)
└── Policies/Finance/ (FinancePolicy)
```

### 2.2. Logic nghiệp vụ đặc thù (Service Layer)
- **PaymentService::create()**:
  1. Validate tổng `allocations[].amount` == `payment.amount`.
  2. Khởi tạo `DB::transaction()`.
  3. Tạo `Payment` -> Tạo các `PaymentAllocation`.
  4. Trigger `InvoiceService::updatePaidStatus()` cho từng hóa đơn.
  5. Gọi `LedgerService::recordPayment()` để tạo bút toán sổ cái.
  6. Ghi log action qua `SystemLoggable`.

---

## 3. DANH SÁCH API (API ENDPOINTS)

### 3.1. Phân hệ Thanh toán (Payments)
- **GET** `/api/finance/payments`
    - *Mô tả*: Danh sách các giao dịch thu tiền.
    - *Query Params*: `per_page`, `page`, `filter[property_id]`, `filter[status]`, `filter[method]`, `filter[received_between]`, `search`, `sort`.
- **POST** `/api/finance/payments`
    - *Mô tả*: Ghi nhận thu tiền và gạch nợ hóa đơn (Atomic transaction).
- **GET** `/api/finance/payments/{id}`
    - *Mô tả*: Chi tiết một giao dịch và các `allocations` đi kèm.
- **DELETE** `/api/finance/payments/{id}`
    - *Mô tả*: Hủy bỏ giao dịch (Soft delete) và hoàn tác trạng thái gạch nợ trên hóa đơn.

### 3.2. Phân hệ Sổ cái & Dòng tiền (Ledger & Cashflow)
- **GET** `/api/finance/ledger`
    - *Mô tả*: Truy vấn lịch sử bút toán sổ cái để đối soát tài chính.
    - *Query Params*: `filter[ref_type]`, `filter[ref_id]`, `filter[occurred_between]`.
- **GET** `/api/finance/cashflow`
    - *Mô tả*: Báo cáo dòng tiền thực tế In/Out theo thời gian.
- **POST** `/api/finance/cashflow`
    - *Mô tả*: Ghi nhận các khoản thu/chi ngoài hóa đơn (ví dụ: chi phí bảo trì đột xuất, thu khác).

---

## 4. API CONTRACTS & DỮ LIỆU MẪU (SPECIFICATIONS)

### 4.1. API Thu tiền & Gạch nợ (Payment Injection)
- **Endpoint**: `POST /api/finance/payments`
- **Request Body (Mẫu chuẩn)**:
```json
{
  "property_id": "9b9eb2ee-1234-5678-abcd-1234567890ab",
  "payer_user_id": "9b9eb2ee-..." ,
  "method": "TRANSFER",
  "amount": 5500000.00,
  "received_at": "2024-03-16T15:00:00Z",
  "reference": "CK_PHONG_A101_THANG_3",
  "allocations": [
    { "invoice_id": "uuid-inv-1", "amount": 5000000.00 },
    { "invoice_id": "uuid-inv-2", "amount": 500000.00 }
  ],
  "note": "Thu tiền phòng và phí dịch vụ"
}
```

### 4.2. Response Output (PaymentResource)
Đảm bảo trả về thông tin quan hệ (Property, Invoice Code) để UI hiển thị:
```json
{
  "data": {
    "id": "uuid-payment",
    "status": "APPROVED",
    "method": "TRANSFER",
    "amount": 5500000.0,
    "property": { "id": "uuid", "name": "Toà Nhà A" },
    "allocations": [
      { "invoice_id": "uuid", "amount": 5000000.0, "invoice_code": "INV-2024-001" }
    ],
    "created_at": "2024-03-16T15:05:00Z"
  }
}
```

---

## 5. QUY TRÌNH TRIỂN KHAI (IMPLEMENTATION WORKFLOW)

### Bước 1: Khởi tạo Module (Scaffold)
Sử dụng công cụ agentic để tạo khung xương chuẩn:
```bash
/scaffold_module domain=Finance models=Payment,PaymentAllocation,LedgerEntry,CashflowEntry
```

### Bước 2: Thiết kế Database
Mapping từ `docs/database.dbml`. 
- **Lưu ý**: Kiểu dữ liệu tiền tệ bắt buộc là `decimal(15,2)`.
- **FK**: Toàn bộ foreign keys phải có indexes và đảm bảo tính nhất quán (on delete restrict/cascade tùy loại).

### Bước 3: Phát triển Logic & Security
1. Cấu hình `FinancePolicy` và chạy `php artisan rbac:sync`.
2. Viết Unit Test cho `PaymentService` để kiểm tra các case gạch nợ (thiếu tiền, thừa tiền, hóa đơn của property khác).
3. Thực hiện `vendor/bin/pint --format agent` trước khi commit.

### Bước 4: Kiểm soát Dòng tiền (Cashflow)
Tích hợp `CashflowEntry` vào mọi giao dịch `Payment` để theo dõi lãi lỗ thực tế (`type: IN/OUT`).


