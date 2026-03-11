# Module: Hợp đồng (Contract)

## Tổng quan
Module quản lý hợp đồng thuê phòng, thành viên trong hợp đồng, và toàn bộ luồng ký/từ chối hợp đồng của Tenant.

**Controllers:**
- `App\Http\Controllers\Api\Contract\ContractController`
- `App\Http\Controllers\Api\Contract\ContractMemberController`

**Services:**
- `App\Services\Contract\ContractService`

**Policy:**
- `App\Policies\Contract\ContractPolicy`

---

## Contract CRUD

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/contracts` | Danh sách hợp đồng (theo org scope) | Owner, Manager, Staff |
| `POST`   | `/api/contracts` | Tạo hợp đồng mới | Owner, Manager |
| `GET`    | `/api/contracts/{id}` | Chi tiết hợp đồng | All roles (với membership scope) |
| `PUT`    | `/api/contracts/{id}` | Cập nhật hợp đồng | Owner, Manager |
| `DELETE` | `/api/contracts/{id}` | Soft delete | Owner |
| `GET`    | `/api/contracts/trash` | Thùng rác | Owner |
| `POST`   | `/api/contracts/{id}/restore` | Khôi phục | Owner |
| `DELETE` | `/api/contracts/{id}/force` | Xóa vĩnh viễn | Owner |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Trang quản lý hợp đồng (Dành cho Quản lý)**:
    - Danh sách hợp đồng kèm trạng thái (Draft, Active, Ended).
    - Bộ lọc theo Tòa nhà, Phòng.
    - Tìm kiếm theo tên khách thuê (search through members).
- [ ] **Luồng ký hợp đồng (Dành cho Tenant)**:
    - Hiển thị danh sách `My Pending Contracts`.
    - Trang chi tiết hợp đồng chờ ký (hiển thị thông tin cơ bản nhưng ẩn mã `join_code`).
    - Nút "Xác nhận ký" và "Từ chối".
- [ ] **Trang đổi phòng (Room Transfer)**:
    - Hiển thị thông tin phòng hiện tại.
    - Nút "Xin đổi phòng" → Hiển thị modal/list các phòng trống### 1. Công việc cần làm (Tasks)
- [ ] **Tạo Hợp đồng (Flow)**:
    - Bước 1: Chọn phòng (Room) -> Hiện giá & dịch vụ mặc định.
    - Bước 2: Nhập thông tin khách thuê (Tenant) / Chọn từ danh sách có sẵn.
    - Bước 3: Cấu hình chu kỳ thanh toán, ngày bắt đầu, tiền cọc.
    - Bước 4: Lưu DRAFT -> Xem trước (Preview) -> Gửi khách ký.
- [ ] **Ký hợp đồng (Tenant App)**:
    - Nhận thông báo hợp đồng mới.
    - Đọc nội dung & Điều khoản.
    - Xác nhận bằng OTP hoặc chữ ký điện tử -> Chuyển trạng thái `ACTIVE`.
- [ ] **Phụ lục & Chuyển phòng**:
    - Giao diện tạo phụ lục thay đổi giá/dịch vụ.
    - Form chuyển phòng: Chọn phòng mới -> Hệ thống tự tính chênh lệch cọc/tiền thuê.

### 2. Query Parameters (Filters & Search)
*Endpoint: `GET /api/contracts`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `search` | string | Tìm theo số hợp đồng, tên khách thuê |
| `filter[status]` | string | `DRAFT`, `ACTIVE`, `ENDED`, `CANCELLED` |
| `filter[property_id]` | uuid | Lọc hợp đồng theo tòa nhà |
| `filter[room_id]` | uuid | Lọc hợp đồng theo phòng |
| `sort` | string | `start_date`, `created_at`, `total_amount` |
| `page`, `per_page` | int | Chuẩn phân trang |

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/contracts`**
```json
{
  "room_id": "...",
  "tenant_id": "...",
  "start_date": "2024-03-01",
  "billing_cycle": "MONTHLY",
  "deposit_amount": 10000000,
  "services": [
    { "service_id": "...", "custom_price": 4000 }
  ]
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/contracts/{id}`**
```json
{
  "data": {
    "id": "...",
    "contract_number": "CON-2024-001",
    "status": "ACTIVE",
    "tenant": { "full_name": "Nguyễn Văn A" },
    "room": { "room_number": "101" },
    "total_amount": 5000000.0
  },
  "links": {
    "self": "..."
  }
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

| Role | Chức năng hiển thị | Ghi chú |
|------|--------------------|---------|
| **Owner** | Full CRUD | Phê duyệt thanh lý hợp đồng |
| **Manager** | CRUD Draft & Confirm | Quản lý vòng đời hợp đồng |
| **Staff** | View & Create Draft | Hỗ trợ làm thủ tục ban đầu |
| **Tenant** | View & Accept | Ký và xem lịch sử thanh toán |

---

## Module Feature Matrix

| Feature | `contracts.index` | `contracts.show` |
|---------|-------------------|------------------|
| Searching | ✅ | ❌ |
| Filtering | ✅ | ❌ |
| Sorting | ✅ | ❌ |
| Pagination | ✅ | ❌ |
thấy `join_code` của chính mình. Phải dùng email/OTP để verify khi accept signature. |

---

## Tenant Signature Flow

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `GET`  | `/api/contracts/my-pending` | Lấy danh sách hợp đồng chờ ký | ✅ Tenant |
| `POST` | `/api/contracts/{id}/accept-signature` | Đồng ý ký hợp đồng | ✅ Tenant |
| `POST` | `/api/contracts/{id}/reject-signature` | Từ chối hợp đồng | ✅ Tenant |

---

## Tenant Self-Service

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/contracts/{id}/members` | Mời bạn cùng phòng | ✅ Tenant (APPROVED member) |
| `GET`  | `/api/contracts/{id}/available-rooms` | Xem phòng trống cùng tòa nhà | ✅ Tenant (APPROVED member) |
| `POST` | `/api/contracts/{id}/room-transfer-request` | Xin đổi phòng | ✅ Tenant (APPROVED member) |

---

## Contract Member CRUD

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/contracts/{id}/members` | Danh sách thành viên hợp đồng | Owner, Manager |
| `POST`   | `/api/contracts/{id}/members` | Thêm thành viên (Tenant mời roommate) | Owner, Manager, **Tenant*** |
| `GET`    | `/api/contracts/{id}/members/{mid}` | Chi tiết thành viên | Owner, Manager |
| `PUT`    | `/api/contracts/{id}/members/{mid}` | Cập nhật thành viên | Owner, Manager |
| `DELETE` | `/api/contracts/{id}/members/{mid}` | Xóa thành viên | Owner |
| `PUT`    | `/api/contracts/{id}/members/{mid}/approve` | Phê duyệt thành viên | Owner, Manager |

> ⚠️ Tenant*: Chỉ Tenant đang là thành viên APPROVED của hợp đồng mới được mời thêm người (role default: ROOMMATE)

---

## Contract Status Flow

```
DRAFT → (Tenant ký) → ACTIVE → (Kết thúc) → ENDED
                              → (Hủy) → CANCELLED
```

## ContractMember Status Flow

```
PENDING → (Tenant accept) → APPROVED
        → (Tenant reject) → REJECTED
```

---

## Cấu trúc Hợp đồng (Tóm tắt DB)

| Field | Mô tả |
|-------|-------|
| `org_id` | Tổ chức |
| `property_id` | Tòa nhà |
| `room_id` | Phòng |
| `status` | DRAFT / ACTIVE / ENDED / CANCELLED |
| `start_date`, `end_date` | Thời hạn hợp đồng |
| `rent_price` | Giá thuê |
| `deposit_amount` | Tiền cọc |
| `billing_cycle` | MONTHLY / QUARTERLY |
| `due_day`, `cutoff_day` | Ngày thanh toán |
| `join_code` | Mã tham gia (ẩn với Tenant khi pending) |
| `meta` | JSON (transfer_requests, ...) |
| `signed_at`, `terminated_at` | Mốc thời gian |

---

## Dormant Tenant (Tenant chưa có hợp đồng)

- Tenant mới đăng ký qua invite → tài khoản tồn tại nhưng **không có contract ACTIVE**
- Khi call `GET /api/rooms` hoặc `GET /api/properties` → kết quả **rỗng** (scope tự lọc)
- Tenant phải vào `GET /api/contracts/my-pending` → chấp nhận hợp đồng → mới unlock access

---

## Phân quyền RBAC (Backend Policy)

| Hành động | Admin | Owner | Manager | Staff | Tenant |
|-----------|-------|-------|---------|-------|--------|
| CRUD Contract | ✅ | ✅ | ✅ | 🔶 R only | ❌ |
| View own contract | ✅ | ✅ | ✅ | ✅ | 🔶 membership |
| Sign/Reject | ❌ | ❌ | ❌ | ❌ | ✅ |
| Add member (roommate) | ✅ | ✅ | ✅ | ❌ | 🔶 own contract |
| Room transfer | ❌ | ❌ | ❌ | ❌ | ✅ |
