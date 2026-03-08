# Module: Hợp đồng (Contract)

## Tổng quan
Module quản lý vòng đời hợp đồng thuê, từ lúc tạo nháp, ký kết, quản lý thành viên cho đến khi thanh lý hoặc đổi phòng.

**Controllers:**
- `App\Http\Controllers\Api\Contract\ContractController`
- `App\Http\Controllers\Api\Contract\ContractMemberController`
- `App\Http\Controllers\Api\Contract\TenantSelfServiceController`

**Services:**
- `App\Services\Contract\ContractService`

**Policies:**
- `App\Policies\Contract\ContractPolicy`

---

## Contract Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/contracts` | Danh sách hợp đồng | Owner, Manager, Staff |
| `POST`   | `/api/contracts` | Tạo hợp đồng mới | Owner, Manager |
| `GET`    | `/api/contracts/{id}` | Chi tiết hợp đồng | Owner, Manager, Staff, Tenant* |
| `PUT`    | `/api/contracts/{id}` | Cập nhật hợp đồng | Owner, Manager |
| `DELETE` | `/api/contracts/{id}` | Soft delete | Owner |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Quản lý Hợp đồng (Manager/Staff)**:
    - Form tạo hợp đồng nhiều bước: Chọn Phòng -> Chọn Khách thuê chính -> Cấu hình giá & Ngày đặt cọc -> Lưu nháp (DRAFT).
    - Quản lý trạng thái: Chốt hợp đồng để gửi cho khách ký (PENDING_SIGNATURE).
    - Hủy hợp đồng hoặc Thanh lý hợp đồng (ENDED).
- [ ] **Cổng thông tin khách thuê (Tenant Portal)**:
    - Xem danh sách hợp đồng đang chờ ký (`GET /api/contracts/my-pending`).
    - Quy trình Ký điện tử: Hiển thị nội dung -> Checkbox xác nhận -> Nút "Ký hợp đồng" (`POST /api/contracts/{id}/accept-signature`).
    - Mời người ở cùng (Roommate): Nhập thông tin để tạo `ContractMember`.
- [ ] **Yêu cầu Đổi phòng (Room Transfer)**:
    - Hiển thị danh sách phòng trống cùng tòa nhà.
    - Gửi yêu cầu đổi phòng kèm lý do.

### 2. Query Parameters (Filters & Search)
*Endpoint: `GET /api/contracts`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `search` | string | Tìm theo tên khách hoặc mã hợp đồng |
| `filter[status]` | string | `DRAFT`, `ACTIVE`, `PENDING_SIGNATURE`, `ENDED` |
| `filter[room_id]` | uuid | Lọc hợp đồng theo phòng |
| `sort` | string | `start_date`, `created_at` |

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/contracts/{id}/members` (Mời roommate)**
```json
{
  "full_name": "Trần Thị C",
  "email": "roommate@example.com",
  "phone": "0901234567",
  "identity_number": "123456789"
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/contracts/my-pending`**
```json
{
  "data": [
    {
      "id": "...",
      "contract_code": "CON-2024-001",
      "room": { "room_number": "101" },
      "start_date": "2024-03-01",
      "status": "PENDING_SIGNATURE"
    }
  ]
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

- **Tenant**: Chỉ thấy các hợp đồng mà mình là "Khách thuê chính" (Member role = PRIMARY).
- **Dormant Tenant**: Những khách chưa có hợp đồng ACTIVE sẽ bị giới hạn quyền xem thông tin tòa nhà/phòng (FE cần check status hợp đồng để cảnh báo).
- **Manager**: Có quyền thêm thành viên, đổi trạng thái và xử lý yêu cầu đổi phòng.

---

## Tenant Self-Service Endpoints

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| `GET`  | `/api/contracts/my-pending` | HĐ đang chờ mình ký | ✅ Tenant |
| `POST` | `/api/contracts/{id}/accept-signature` | Ký chấp nhận | ✅ Tenant |
| `POST` | `/api/contracts/{id}/members` | Mời roommate | ✅ Tenant |
| `POST` | `/api/contracts/{id}/room-transfer-request` | Xin đổi phòng | ✅ Tenant |
