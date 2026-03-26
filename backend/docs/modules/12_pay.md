# Module: Thanh toán Hóa đơn qua VNPay (Payment – VNPay Integration)

> **Phiên bản tài liệu:** 1.0 — 2026-03-25
> **Dựa trên backend:** `Finance\PaymentController`, `Finance\PaymentService`, `Invoice\InvoiceController`

---

## 1. Tổng quan kiến trúc thanh toán

Hệ thống Hostech sử dụng mô hình **Payment + Allocation (Gạch nợ)**, cho phép một giao dịch thu tiền thanh toán cho **một hoặc nhiều hóa đơn cùng lúc**.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LUỒNG THANH TOÁN TỔNG QUÁT                      │
│                                                                     │
│  [Hóa đơn ISSUED] ──►  [Chọn phương thức] ──►  [Ghi Payment]       │
│                                                         │            │
│                                        ┌────────────────▼──────┐   │
│                                        │  PaymentAllocation    │   │
│                                        │  (gạch nợ từng HĐ)   │   │
│                                        └────────────────┬──────┘   │
│                                                         │            │
│                                        ┌────────────────▼──────┐   │
│                                        │   Invoice → PAID      │   │
│                                        │   LedgerEntry ghi sổ  │   │
│                                        └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Các phương thức thanh toán hỗ trợ

| Method | Mô tả | Kịch bản dùng |
|--------|-------|---------------|
| `CASH` | Tiền mặt | Thu tiền trực tiếp tại quầy |
| `TRANSFER` | Chuyển khoản ngân hàng | Khách chuyển khoản thủ công |
| `QR` | Quét mã QR (VNPay QR, VietQR) | Tạo QR tức thời, khách quét |
| `WALLET` | Ví điện tử | VNPay Wallet, MoMo... |

> **VNPay Integration** áp dụng cho method `QR` (VNPay QR) và `WALLET` (VNPay Wallet).

---

## 2. Sơ đồ luồng VNPay (Sequence Diagram)

```
Frontend         Backend API          VNPay Gateway       DB
   │                  │                     │               │
   │ 1. Lấy danh      │                     │               │
   │    sách HĐ cần   │                     │               │
   │    thanh toán     │                     │               │
   │──GET /invoices──►│                     │               │
   │◄─Invoice list────│                     │               │
   │                  │                     │               │
   │ 2. Người dùng    │                     │               │
   │    chọn HĐ &     │                     │               │
   │    nhấn "Thanh   │                     │               │
   │    toán VNPay"   │                     │               │
   │                  │                     │               │
   │ 3. Tạo Payment   │                     │               │
   │    (method=QR)    │                     │               │
   │──POST /finance/payments──►│            │               │
   │                  │─────────────────────►               │
   │                  │   (Tạo Payment,     │               │
   │                  │    ghi LedgerEntry) │               │
   │                  │◄────────────────────│               │
   │◄─Payment{APPROVED}│                    │               │
   │                  │                     │               │
   │ 4. Hiển thị QR   │                     │               │
   │    VNPay cho     │                     │               │
   │    khách quét    │                     │               │
   │                  │                     │               │
   │ 5. [Khách quét QR & thanh toán trên VNPay app]        │
   │                  │                     │               │
   │                  │◄──Webhook IPN───────│               │
   │                  │  (provider_ref,     │               │
   │                  │   provider_status)  │               │
   │                  │──Update Payment─────────────────────►
   │                  │  provider_status=SUCCESS            │
   │                  │                     │               │
   │ 6. Frontend poll │                     │               │
   │    GET /finance/ │                     │               │
   │    payments/{id} │                     │               │
   │──GET ───────────►│                     │               │
   │◄─Payment{status=APPROVED, provider_status=SUCCESS}     │
   │                  │                     │               │
   │ ✅ Hiển thị xác  │                     │               │
   │    nhận thành    │                     │               │
   │    công          │                     │               │
```

---

## 3. API Endpoints liên quan

### 3.1 Lấy danh sách hóa đơn cần thanh toán

```
GET /api/invoices?filter[status]=ISSUED&per_page=50
GET /api/properties/{property_id}/invoices?filter[status]=ISSUED
```

**Filters hữu ích:**

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `filter[status]` | string | `ISSUED`, `PARTIALLY_PAID` — hóa đơn chờ thanh toán |
| `filter[room_id]` | uuid | Hóa đơn của phòng cụ thể |
| `filter[contract_id]` | uuid | Hóa đơn của hợp đồng cụ thể |
| `per_page` | int | Số bản ghi mỗi trang (default 15) |

---

### 3.2 Tạo giao dịch thanh toán (⭐ Endpoint chính)

```
POST /api/finance/payments
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "property_id": "uuid-property",
  "payer_user_id": "uuid-user-tenant",
  "method": "QR",
  "amount": 6500000,
  "reference": "VNPAY_TXN_20260325_001",
  "received_at": "2026-03-25T14:30:00+07:00",
  "note": "Thanh toán hóa đơn tháng 3/2026 qua VNPay QR",
  "meta": {
    "gateway": "VNPAY",
    "vnpay_txn_ref": "HOSTECH20260325001",
    "vnpay_bank_code": "NCB",
    "vnpay_card_type": "ATM"
  },
  "allocations": [
    {
      "invoice_id": "uuid-invoice-1",
      "amount": 5000000
    },
    {
      "invoice_id": "uuid-invoice-2",
      "amount": 1500000
    }
  ]
}
```

> ⚠️ **Quy tắc bắt buộc:** `SUM(allocations[].amount)` **phải bằng** `amount`.
> Backend sẽ trả về HTTP 422 nếu tổng không khớp.

**Validation Rules (backend):**

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `method` | string | ✅ | `CASH`, `TRANSFER`, `QR`, `WALLET` |
| `amount` | decimal | ✅ | Tổng tiền thu. Min: 0.01 |
| `property_id` | uuid | ❌ | ID tòa nhà |
| `payer_user_id` | uuid | ❌ | ID người nộp tiền |
| `reference` | string | ❌ | Mã tham chiếu VNPay (max 255) |
| `received_at` | datetime | ❌ | Thời gian nhận tiền ISO 8601 |
| `note` | string | ❌ | Ghi chú (max 1000 ký tự) |
| `meta` | object | ❌ | Payload phụ (lưu thông tin VNPay) |
| `allocations` | array | ✅ | Danh sách gạch nợ (min 1 phần tử) |
| `allocations[].invoice_id` | uuid | ✅ | UUID hóa đơn cần gạch nợ |
| `allocations[].amount` | decimal | ✅ | Số tiền gạch vào hóa đơn này |

**Response khi thành công (HTTP 201):**

```json
{
  "data": {
    "id": "uuid-payment",
    "status": "APPROVED",
    "method": "QR",
    "amount": 6500000.0,
    "reference": "VNPAY_TXN_20260325_001",
    "note": "Thanh toán hóa đơn tháng 3/2026 qua VNPay QR",
    "property": { "id": "...", "name": "Tòa nhà A" },
    "payer": { "id": "...", "name": "Nguyễn Văn A" },
    "received_by": { "id": "...", "name": "Manager B" },
    "approved_by": { "id": "...", "name": "Manager B" },
    "allocations": [
      {
        "id": "uuid-alloc-1",
        "invoice_id": "uuid-invoice-1",
        "amount": 5000000.0,
        "invoice_code": "INV-A101-2603",
        "invoice_status": "PAID",
        "invoice_total": 5000000.0
      },
      {
        "id": "uuid-alloc-2",
        "invoice_id": "uuid-invoice-2",
        "amount": 1500000.0,
        "invoice_code": "INV-A102-2603",
        "invoice_status": "PAID",
        "invoice_total": 1500000.0
      }
    ],
    "received_at": "2026-03-25T07:30:00Z",
    "approved_at": "2026-03-25T07:30:00Z",
    "created_at": "2026-03-25T07:30:00Z"
  }
}
```

---

### 3.3 Chi tiết giao dịch (dùng để polling / kiểm tra)

```
GET /api/finance/payments/{id}
Authorization: Bearer {token}
```

Dùng để:
- **Polling** sau khi tạo Payment: kiểm tra `provider_status` để xác nhận VNPay đã thu tiền
- Hiển thị chi tiết lịch sử giao dịch

---

### 3.4 Danh sách giao dịch

```
GET /api/finance/payments
Authorization: Bearer {token}
```

**Query Parameters:**

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `filter[status]` | string | `PENDING`, `APPROVED`, `REJECTED` |
| `filter[method]` | string | `CASH`, `TRANSFER`, `QR`, `WALLET` |
| `filter[property_id]` | uuid | Lọc theo tòa nhà |
| `filter[received_between]` | string | `YYYY-MM-DD,YYYY-MM-DD` |
| `sort` | string | `-received_at`, `amount`, `status` (dấu `-` = DESC) |
| `per_page` | int | Default: 15 |

---

### 3.5 Hủy giao dịch (Void)

```
DELETE /api/finance/payments/{id}
Authorization: Bearer {token}
```

**Tác động (Backend tự động xử lý):**
1. Hoàn tác `paid_amount` trên từng hóa đơn đã gạch nợ
2. Nếu hóa đơn đang `PAID` mà chưa đủ tiền sau hoàn tác → chuyển về `ISSUED`
3. Ghi bút toán đảo ngược vào Sổ cái (`LedgerEntry` với `ref_type = payment_reversal`)
4. Soft delete bản ghi Payment

---

## 4. Quy trình Frontend (Step-by-step)

### Bước 1 — Lấy danh sách hóa đơn cần thanh toán

```typescript
// composable: useInvoices.ts
const invoices = await api.get('/invoices', {
  params: {
    'filter[status]': 'ISSUED',
    'filter[property_id]': selectedPropertyId,
    per_page: 50,
  },
});
// Hiển thị danh sách cho user chọn
```

### Bước 2 — Người dùng chọn hóa đơn & nhập số tiền

```typescript
// Tính tổng tự động
const selectedInvoices = ref<Invoice[]>([]);
const allocations = computed(() =>
  selectedInvoices.value.map((inv) => ({
    invoice_id: inv.id,
    amount: inv.remaining_amount, // = total_amount - paid_amount
  }))
);
const totalAmount = computed(() =>
  allocations.value.reduce((sum, a) => sum + a.amount, 0)
);
```

### Bước 3 — Tạo Payment với method = QR

```typescript
// composable: usePayment.ts
async function createVNPayPayment(payload: CreatePaymentPayload) {
  const response = await api.post('/finance/payments', {
    property_id: payload.propertyId,
    payer_user_id: payload.payerUserId,
    method: 'QR',
    amount: payload.totalAmount,
    reference: payload.vnpayTxnRef,  // Mã tham chiếu từ VNPay
    received_at: new Date().toISOString(),
    note: payload.note,
    meta: {
      gateway: 'VNPAY',
      vnpay_txn_ref: payload.vnpayTxnRef,
      vnpay_bank_code: payload.bankCode,
    },
    allocations: payload.allocations,
  });
  return response.data;
}
```

### Bước 4 — Hiển thị QR Code VNPay

Sau khi tạo Payment thành công, frontend hiển thị QR VNPay:

```typescript
// Tạo VietQR / VNPay QR URL
// Spec: https://developers.vietqr.io/
function buildVietQRUrl(params: {
  bankId: string;   // Mã ngân hàng (VCB, TCB, MB...)
  accountNo: string; // Số tài khoản nhận
  amount: number;
  description: string; // Nội dung CK: mã tham chiếu
}) {
  const template = 'compact2'; // hoặc 'qr_only'
  return `https://img.vietqr.io/image/${params.bankId}-${params.accountNo}-${template}.png` +
    `?amount=${params.amount}&addInfo=${encodeURIComponent(params.description)}`;
}

// VNPay QR (merchant)
// Tham khảo VNPay Merchant API docs để tạo URL thanh toán
function buildVNPayUrl(params: VNPayParams): string {
  // Xây dựng URL thanh toán VNPay theo chuẩn VNPay Merchant API v2.1.0
  // Tham số bắt buộc: vnp_TmnCode, vnp_Amount, vnp_TxnRef, vnp_ReturnUrl...
  // ...
}
```

### Bước 5 — Polling / Xác nhận thanh toán

```typescript
// Polling mỗi 3 giây để kiểm tra trạng thái
async function pollPaymentStatus(paymentId: string) {
  const MAX_RETRIES = 20; // 60 giây
  let retries = 0;

  const checkStatus = async () => {
    const { data } = await api.get(`/finance/payments/${paymentId}`);
    const payment = data.data;

    // provider_status = SUCCESS khi VNPay webhook gọi về backend
    if (payment.provider_status === 'SUCCESS' || payment.status === 'APPROVED') {
      clearInterval(timer);
      emit('payment-confirmed', payment);
    }

    if (++retries >= MAX_RETRIES) {
      clearInterval(timer);
      emit('payment-timeout', payment);
    }
  };

  const timer = setInterval(checkStatus, 3000);
  await checkStatus(); // Check ngay lần đầu
}
```

---

## 5. State Machine — Invoice Status

```
                  ┌──►  PARTIALLY_PAID ──┐
                  │    (thanh toán một   │
DRAFT ──► ISSUED ─┤     phần)            ├──► PAID
                  │                      │
                  └──────────────────────┘
                  │
                  └──► CANCELLED
```

| Trạng thái | Ý nghĩa | Hành động được phép |
|------------|---------|---------------------|
| `DRAFT` | Hóa đơn nháp | Chỉnh sửa, Xóa, Phát hành |
| `ISSUED` | Đã phát hành, chờ thanh toán | **Thanh toán (tạo Payment)** |
| `PARTIALLY_PAID` | Thanh toán một phần | **Tiếp tục thanh toán** |
| `PAID` | Đã thanh toán đủ | Xem, Không thể hủy |
| `CANCELLED` | Đã hủy | Không thể thanh toán |

> Frontend **chỉ cho phép tạo Payment** khi hóa đơn ở trạng thái `ISSUED` hoặc `PARTIALLY_PAID`.

---

## 6. Payment Status

| Status | Ý nghĩa |
|--------|---------|
| `APPROVED` | Giao dịch đã được duyệt (auto-approve khi tạo) |
| `PENDING` | Chờ xác nhận (dùng tương lai nếu cần workflow duyệt) |
| `REJECTED` | Bị từ chối |

> **Hiện tại:** Khi tạo Payment qua `/api/finance/payments`, giao dịch tự động được set `status = APPROVED` và `approved_by = user hiện tại`.

---

## 7. Cấu trúc dữ liệu DB liên quan

```
payments
├── id (uuid, PK)
├── org_id (FK → orgs)
├── property_id (FK → properties, nullable)
├── invoice_id (FK → invoices, nullable)       ← direct link (v2)
├── payer_user_id (FK → users, nullable)
├── received_by_user_id (FK → users)
├── method (CASH|TRANSFER|QR|WALLET)
├── amount (decimal 15,2)
├── reference (varchar 255)                    ← mã CK / mã VNPay
├── received_at (timestamp)
├── status (PENDING|APPROVED|REJECTED)
├── approved_by_user_id (FK → users)
├── approved_at (timestamp)
├── note (text)
├── provider_ref (varchar 255)                 ← mã giao dịch VNPay
├── provider_status (varchar 50)               ← SUCCESS|FAILED|PENDING
├── webhook_payload (json)                     ← raw payload từ VNPay webhook
├── meta (json)                                ← thông tin phụ tuỳ ý
└── deleted_at (soft delete)

payment_allocations
├── id (uuid, PK)
├── org_id (FK → orgs)
├── payment_id (FK → payments)
├── invoice_id (FK → invoices)
└── amount (decimal 15,2)
    → UNIQUE(payment_id, invoice_id)

ledger_entries
├── id (uuid, PK)
├── org_id (FK → orgs)
├── ref_type (payment | payment_reversal | cashflow_manual)
├── ref_id (uuid → payments.id)
├── debit (decimal 15,2)   ← Tiền vào (khi thu)
├── credit (decimal 15,2)  ← Tiền ra (khi hoàn)
├── occurred_at (timestamp)
└── meta (json)
```

---

## 8. Xử lý lỗi (Error Handling)

| HTTP Status | Code / Message | Nguyên nhân | Xử lý Frontend |
|-------------|----------------|-------------|----------------|
| `422` | Tổng số tiền phân bổ phải bằng số tiền thanh toán | `SUM(allocations) ≠ amount` | Kiểm tra lại tổng tiền trước khi submit |
| `422` | Hóa đơn không hợp lệ hoặc không thuộc tổ chức | Invoice khác org | Xóa hóa đơn không hợp lệ khỏi list |
| `422` | Không thể xác định org_id | User không có org_id | Yêu cầu Admin chỉ định org |
| `403` | Unauthorized | Không đủ quyền `create:payment` | Ẩn nút thanh toán với user không có quyền |
| `404` | Payment Not Found | ID không tồn tại | Redirect về danh sách |
| `422` | Chỉ có thể hủy giao dịch đã APPROVED | Void payment không đúng status | Disable nút hủy nếu status ≠ APPROVED |

---

## 9. Phân quyền RBAC

| Action | Owner | Manager | Staff | Tenant |
|--------|-------|---------|-------|--------|
| Xem danh sách Payment | ✅ | ✅ (property mình) | ✅ (property mình) | ❌ |
| Tạo Payment (ghi nhận thu tiền) | ✅ | ✅ | ❌ | ❌ |
| Xem chi tiết Payment | ✅ | ✅ | ✅ | ❌ |
| Hủy (Void) Payment | ✅ | ✅ | ❌ | ❌ |
| Xem Sổ cái (Ledger) | ✅ | ✅ | ❌ | ❌ |
| Xem Dòng tiền (Cashflow) | ✅ | ✅ | ❌ | ❌ |

> **Backend scoping:** Manager/Staff chỉ thấy payments thuộc property được giao (`property.managers` pivot).

---

## 10. Checklist tích hợp VNPay (Frontend Tasks)

### 10.1 Màn hình Danh sách Hóa đơn

- [ ] Hiển thị cột `status` với badge màu sắc:
  - `DRAFT` → xám
  - `ISSUED` → xanh dương (chờ thanh toán)
  - `PARTIALLY_PAID` → cam
  - `PAID` → xanh lá
  - `CANCELLED` → đỏ
- [ ] Bộ lọc nhanh theo status
- [ ] Nút **"Ghi nhận thanh toán"** chỉ hiện khi status = `ISSUED` hoặc `PARTIALLY_PAID`
- [ ] Hiển thị `paid_amount` / `total_amount` dạng progress bar

### 10.2 Màn hình Tạo giao dịch VNPay

- [ ] Form chọn hóa đơn (multi-select, tự động tính tổng)
- [ ] Chọn phương thức: `QR` / `WALLET` / `TRANSFER` / `CASH`
- [ ] Field `reference` (tự động điền mã VNPay khi webhook trả về)
- [ ] Field `note` & `received_at`
- [ ] Validate: tổng `allocations` = `amount` trước khi submit
- [ ] Xử lý lỗi 422 với message cụ thể

### 10.3 Màn hình QR Thanh toán

- [ ] Hiển thị QR Code VNPay / VietQR
- [ ] Hiển thị số tiền, nội dung chuyển khoản (mã tham chiếu)
- [ ] Đếm ngược thời gian (timeout 5 phút)
- [ ] Polling API `/finance/payments/{id}` mỗi 3 giây
- [ ] Hiển thị spinner "Đang chờ xác nhận..."
- [ ] Success screen khi `provider_status = SUCCESS`
- [ ] Nút "Xác nhận thủ công" (cho trường hợp webhook delay)

### 10.4 Màn hình Chi tiết Payment

- [ ] Hiển thị thông tin payment (method, amount, reference, received_at)
- [ ] Bảng allocations (hóa đơn đã gạch nợ + số tiền từng hóa đơn)
- [ ] Badge `provider_status` (VNPay transaction status)
- [ ] Nút **"Hủy giao dịch"** (chỉ hiện với role Owner/Manager, chỉ khi status = APPROVED)

### 10.5 Màn hình Danh sách Thanh toán

- [ ] Bộ lọc: method, status, property, khoảng thời gian
- [ ] Hiển thị tổng thu theo bộ lọc
- [ ] Export Excel (tương lai)

---

## 11. Ghi nhận thanh toán nhanh (Quick Pay — 1 hóa đơn)

Nếu chỉ cần thanh toán **1 hóa đơn**, có thể dùng endpoint nhanh hơn:

```
POST /api/invoices/{id}/record-payment
Authorization: Bearer {token}
```

```json
{
  "amount": 5000000,
  "method": "QR",
  "reference": "VNPAY_20260325",
  "received_at": "2026-03-25T14:30:00+07:00",
  "note": "Thanh toán qua VNPay"
}
```

> ⚠️ **Lưu ý:** Endpoint này tạo Payment và tự động allocate toàn bộ amount vào hóa đơn đó. Không phải gọi qua `PaymentService` đầy đủ. Phù hợp cho thanh toán đơn giản 1-1.

---

## 12. Tích hợp VNPay — Lưu ý kỹ thuật

### Các trường VNPay cần lưu trên `Payment`

| Field DB | Giá trị VNPay | Ý nghĩa |
|----------|--------------|---------|
| `method` | `QR` hoặc `WALLET` | Loại thanh toán |
| `reference` | `vnp_TxnRef` | Mã giao dịch phía Hostech tạo |
| `provider_ref` | `vnp_TransactionNo` | Mã giao dịch phía VNPay trả về |
| `provider_status` | `SUCCESS` / `FAILED` | Kết quả từ VNPay |
| `webhook_payload` | Raw payload webhook | Lưu nguyên để audit |
| `meta.vnpay_bank_code` | `vnp_BankCode` | Mã ngân hàng |
| `meta.vnpay_card_type` | `vnp_CardType` | Loại thẻ/ví |

### VNPay IPN Webhook (Backend xử lý)

Backend cần implement endpoint IPN để nhận callback từ VNPay:
```
POST /api/payment/vnpay/ipn   ← Backend cần thêm route này
```

Khi VNPay gọi callback:
1. Backend verify checksum `vnp_SecureHash`
2. Cập nhật `payments.provider_ref = vnp_TransactionNo`
3. Cập nhật `payments.provider_status = SUCCESS/FAILED`
4. Cập nhật `payments.webhook_payload = raw_payload`
5. Nếu `FAILED` → void payment, hoàn tác gạch nợ

### VNPay Return URL

```
GET /payment/vnpay/return?vnp_TxnRef=...&vnp_ResponseCode=00...
```
Frontend nhận redirect sau khi khách thanh toán xong trên VNPay portal.
- `vnp_ResponseCode = 00` → Thành công
- Gọi API cập nhật trạng thái nếu webhook chưa được gọi

---

## 13. Lưu ý quan trọng (Business Rules)

> [!IMPORTANT]
> **Kiểm tra bắt buộc trước khi gửi API:**
> - `SUM(allocations[].amount)` **phải bằng** `amount` (chênh lệch > 0.01 sẽ bị từ chối)
> - Hóa đơn phải ở trạng thái `ISSUED` hoặc `PARTIALLY_PAID` mới được gạch nợ
> - Tất cả hóa đơn phải thuộc cùng `org_id` với user đang thao tác

> [!WARNING]
> **Void Payment chỉ được thực hiện khi `status = APPROVED`.**
> Sau khi void, hệ thống tự động hoàn tác toàn bộ gạch nợ và ghi bút toán đảo ngược vào sổ cái.

> [!NOTE]
> **Auto-approve:** Hiện tại khi tạo Payment, hệ thống tự động approve ngay
> (`status = APPROVED`, `approved_by = user tạo`). Không cần bước duyệt riêng.

> [!TIP]
> **Thanh toán nhiều hóa đơn cùng lúc:** Luôn ưu tiên dùng
> `POST /finance/payments` với danh sách `allocations` thay vì gọi API nhiều lần.
> Đây là atomic transaction — nếu 1 hóa đơn lỗi, toàn bộ rollback.

---

## 14. Files Backend liên quan

| File | Mô tả |
|------|-------|
| [PaymentController.php](../../backend/app/Http/Controllers/Api/Finance/PaymentController.php) | Controller xử lý CRUD Payment |
| [PaymentService.php](../../backend/app/Services/Finance/PaymentService.php) | Business logic: tạo payment, gạch nợ, void |
| [LedgerService.php](../../backend/app/Services/Finance/LedgerService.php) | Ghi/đảo ngược bút toán sổ cái |
| [StorePaymentRequest.php](../../backend/app/Http/Requests/Finance/StorePaymentRequest.php) | Validation rules |
| [Payment.php](../../backend/app/Models/Finance/Payment.php) | Model: payment + fields VNPay |
| [PaymentAllocation.php](../../backend/app/Models/Finance/PaymentAllocation.php) | Model: gạch nợ từng hóa đơn |
| [LedgerEntry.php](../../backend/app/Models/Finance/LedgerEntry.php) | Model: bút toán sổ cái |
| [finance.php (routes)](../../backend/routes/api/finance.php) | Route definitions |
| [invoice.php (routes)](../../backend/routes/api/invoice.php) | Route `/invoices/{id}/record-payment` |
