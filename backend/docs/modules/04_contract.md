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
| `GET`    | `/api/contracts/{id}` | Chi tiết hợp đồng | Owner, Manager, Staff |
| `PUT`    | `/api/contracts/{id}` | Cập nhật hợp đồng | Owner, Manager |
| `DELETE` | `/api/contracts/{id}` | Soft delete | Owner |
| `GET`    | `/api/contracts/trash` | Thùng rác | Owner |
| `POST`   | `/api/contracts/{id}/restore` | Khôi phục | Owner |
| `DELETE` | `/api/contracts/{id}/force` | Xóa vĩnh viễn | Owner |

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

## Tenant Signature Flow

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `GET`  | `/api/contracts/my-pending` | Lấy danh sách hợp đồng chờ ký (masked data, ẩn join_code) | ✅ Tenant |
| `POST` | `/api/contracts/{id}/accept-signature` | Đồng ý ký hợp đồng → member PENDING→APPROVED, contract DRAFT→ACTIVE | ✅ Tenant |
| `POST` | `/api/contracts/{id}/reject-signature` | Từ chối hợp đồng → member PENDING→REJECTED | ✅ Tenant |

---

## Tenant Self-Service

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/contracts/{id}/members` | Mời bạn cùng phòng (ROOMMATE/GUARANTOR/TENANT) | ✅ Tenant (APPROVED member) |
| `GET`  | `/api/contracts/{id}/available-rooms` | Xem phòng trống cùng tòa nhà (để xin đổi phòng) | ✅ Tenant (APPROVED member) |
| `POST` | `/api/contracts/{id}/room-transfer-request` | Xin đổi phòng (lưu vào meta.transfer_requests) | ✅ Tenant (APPROVED member) |

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

## Phân quyền RBAC

| Hành động | Admin | Owner | Manager | Staff | Tenant |
|-----------|-------|-------|---------|-------|--------|
| CRUD Contract | ✅ | ✅ | ✅ | 🔶 R only | ❌ |
| View own contract | ✅ | ✅ | ✅ | ✅ | 🔶 membership |
| Sign/Reject | ❌ | ❌ | ❌ | ❌ | ✅ |
| Add member (roommate) | ✅ | ✅ | ✅ | ❌ | 🔶 own contract |
| Room transfer | ❌ | ❌ | ❌ | ❌ | ✅ |
