# Module: Phiếu Sự cố / Yêu cầu (Ticket)

## Tổng quan

Module quản lý phiếu báo cáo sự cố, yêu cầu bảo trì từ cư dân (Tenant) hoặc nhân viên. Hỗ trợ tracking toàn bộ vòng đời xử lý (timeline events), ghi nhận chi phí phát sinh, phân quyền xem và xử lý theo role.

**Controllers:**

- `App\Http\Controllers\Api\Ticket\TicketController`

**Services:**

- `App\Services\Ticket\TicketService`

**Policy:**

- `App\Policies\Ticket\TicketPolicy`

**Models:**

- `App\Models\Ticket\Ticket`
- `App\Models\Ticket\TicketEvent` (Timeline: CREATED, STATUS_CHANGED, COMMENT)
- `App\Models\Ticket\TicketCost` (Chi phí sửa chữa)

---

## Ticket CRUD

| Method   | Endpoint            | Chức năng                                          | Role cần thiết                    |
| -------- | ------------------- | -------------------------------------------------- | --------------------------------- |
| `GET`    | `/api/tickets`      | Danh sách phiếu sự cố (lọc, tìm kiếm, sắp xếp)     | Owner, Manager, Staff, Tenant\*   |
| `POST`   | `/api/tickets`      | Tạo phiếu sự cố mới                                | Owner, Manager, Staff, Tenant     |
| `GET`    | `/api/tickets/{id}` | Chi tiết ticket (kèm events + costs)               | Owner, Manager, Staff, Tenant\*\* |
| `PUT`    | `/api/tickets/{id}` | Cập nhật (priority, category, assigned_to, due_at) | Owner, Manager                    |
| `DELETE` | `/api/tickets/{id}` | Soft delete                                        | Owner, Manager                    |

> **Tenant\***: Chỉ xem được ticket **do chính mình tạo** (`created_by_user_id = user.id`).  
> **Tenant\*\***: Chỉ xem chi tiết ticket do mình tạo; truy cập ticket người khác → `403`.

---

## Status / Events / Costs Management

| Method | Endpoint                   | Chức năng                                                                 | Role cần thiết                      |
| ------ | -------------------------- | ------------------------------------------------------------------------- | ----------------------------------- |
| `PUT`  | `/api/tickets/{id}/status` | Chuyển trạng thái ticket (OPEN → RECEIVED → IN_PROGRESS → DONE/CANCELLED) | Owner, Manager, Staff               |
| `POST` | `/api/tickets/{id}/events` | Thêm bình luận / ghi chú (TicketEvent: COMMENT)                           | Owner, Manager, Staff, Tenant\*\*\* |
| `POST` | `/api/tickets/{id}/costs`  | Ghi nhận chi phí sửa chữa (TicketCost)                                    | Owner, Manager                      |

> **Tenant\*\*\***: Chỉ được comment trên ticket do chính mình tạo.

---

## Ticket Status Flow

```
OPEN → RECEIVED → IN_PROGRESS → WAITING_PARTS → DONE
                                              ↘ CANCELLED
```

**Tự động:**

- Khi chuyển sang `DONE` hoặc `CANCELLED`: hệ thống điền `closed_at = now()`.
- Khi reopen từ `DONE`/`CANCELLED` về `OPEN`: xóa `closed_at`.
- Mỗi lần đổi trạng thái: tự động ghi 1 `TicketEvent` loại `STATUS_CHANGED` kèm `meta.new_status`.

---

## TicketEvent Types

| Event Type       | Trigger               | Lưu `meta`               |
| ---------------- | --------------------- | ------------------------ |
| `CREATED`        | Tạo ticket mới        | `null`                   |
| `STATUS_CHANGED` | Đổi trạng thái ticket | `{"new_status": "DONE"}` |
| `COMMENT`        | User thêm bình luận   | `null`                   |

---

## TicketCost (Chi phí sửa chữa)

| Field                | Mô tả                                     |
| -------------------- | ----------------------------------------- |
| `amount`             | Số tiền (VND, `decimal(12,2)`)            |
| `payer`              | Bên chịu chi phí. Enum: `OWNER`, `TENANT` |
| `note`               | Ghi chú chi tiết (string, nullable)       |
| `created_by_user_id` | Nhân viên ghi nhận chi phí                |

**Điều kiện thêm chi phí:**  
Ticket phải đang ở trạng thái `IN_PROGRESS`, `WAITING_PARTS` hoặc `DONE`.  
Nếu ticket đang `OPEN`, `RECEIVED` hoặc `CANCELLED` → `422`.

---

## Cấu trúc Ticket (Tóm tắt DB)

| Field                      | Type                 | Mô tả                                                                                                 |
| -------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| `id`                       | uuid                 | Primary key                                                                                           |
| `org_id`                   | uuid                 | Tổ chức (tenant key)                                                                                  |
| `property_id`              | uuid                 | Tòa nhà                                                                                               |
| `room_id`                  | uuid                 | Phòng                                                                                                 |
| `contract_id`              | uuid (nullable)      | Hợp đồng liên quan (auto-detect nếu không truyền)                                                     |
| `created_by_user_id`       | uuid                 | Người tạo phiếu (Tenant hoặc Staff)                                                                   |
| `assigned_to_user_id`      | uuid (nullable)      | Nhân viên được giao xử lý                                                                             |
| `category`                 | string (nullable)    | Loại sự cố (Điện, Nước, Internet, Khác...)                                                            |
| `priority`                 | enum                 | Độ ưu tiên: `LOW`, `MEDIUM`, `HIGH`, `URGENT` (default: `MEDIUM`)                                     |
| `status`                   | enum                 | Trạng thái: `OPEN`, `RECEIVED`, `IN_PROGRESS`, `WAITING_PARTS`, `DONE`, `CANCELLED` (default: `OPEN`) |
| `description`              | text                 | Mô tả chi tiết sự cố                                                                                  |
| `due_at`                   | timestamp (nullable) | Hạn chót xử lý                                                                                        |
| `closed_at`                | timestamp (nullable) | Thời điểm đóng phiếu (auto-fill khi `DONE`/`CANCELLED`)                                               |
| `deleted_at`               | timestamp (nullable) | Soft delete                                                                                           |
| `created_at`, `updated_at` | timestamp            | Laravel standard                                                                                      |

---

## Phân quyền RBAC

| Hành động        | Admin | Owner | Manager | Staff | Tenant        |
| ---------------- | ----- | ----- | ------- | ----- | ------------- |
| View All Tickets | ✅    | ✅    | ✅      | ✅    | ❌ (own only) |
| View Own Tickets | ✅    | ✅    | ✅      | ✅    | ✅            |
| Create Ticket    | ✅    | ✅    | ✅      | ✅    | ✅            |
| Update Ticket    | ✅    | ✅    | ✅      | ❌    | ❌            |
| Delete Ticket    | ✅    | ✅    | ✅      | ❌    | ❌            |
| Change Status    | ✅    | ✅    | ✅      | ✅    | ❌            |
| Add Comment      | ✅    | ✅    | ✅      | ✅    | 🔶 own only   |
| Add Cost         | ✅    | ✅    | ✅      | ❌    | ❌            |

---

## Luồng nghiệp vụ điển hình

### 1. Tenant báo cáo sự cố

```
1. Tenant POST /api/tickets
   - Payload: { property_id, room_id, description, category: "Điện", priority: "URGENT" }
   - Auto: org_id, created_by_user_id, status=OPEN, contract_id tự tìm
   - Response: 201, ticket mới kèm TicketEvent CREATED

2. Owner xem danh sách: GET /api/tickets?filter[status]=OPEN&sort=-priority
   - Ticket URGENT nổi lên đầu

3. Owner giao việc: PUT /api/tickets/{id}
   - Payload: { assigned_to_user_id: "uuid-staff" }
   - Response: 200

4. Staff đổi trạng thái: PUT /api/tickets/{id}/status
   - Payload: { status: "IN_PROGRESS" }
   - Auto: Ghi TicketEvent STATUS_CHANGED

5. Staff thêm bình luận: POST /api/tickets/{id}/events
   - Payload: { message: "Đã kiểm tra, cần thay cầu dao" }
   - Response: 201

6. Owner ghi chi phí: POST /api/tickets/{id}/costs
   - Payload: { amount: 150000, payer: "TENANT", note: "Thay cầu dao 2P" }
   - Response: 201

7. Staff hoàn tất: PUT /api/tickets/{id}/status
   - Payload: { status: "DONE" }
   - Auto: closed_at = now()
```

### 2. Tenant xem ticket của mình

```
GET /api/tickets
→ Backend tự động scope WHERE created_by_user_id = user.id (nếu role=Tenant)

GET /api/tickets/{id}
→ Policy check: Nếu Tenant, chỉ được xem ticket do mình tạo
→ Response kèm events[] (timeline) + costs[] (chi phí)
```

---

## API Query Parameters (Filtering & Sorting)

### Query Parameters hỗ trợ (GET /api/tickets)

| Parameter                     | Type   | Mô tả                                                                                              | Ví dụ         |
| ----------------------------- | ------ | -------------------------------------------------------------------------------------------------- | ------------- |
| `per_page`                    | int    | Số lượng/trang (default: 15, max: 100)                                                             | `10`          |
| `page`                        | int    | Số trang                                                                                           | `1`           |
| `search`                      | string | Tìm kiếm theo `description` hoặc `category`                                                        | `điện`        |
| `sort`                        | string | Sắp xếp (prefix `-` giảm dần). Trường: `created_at`, `updated_at`, `due_at`, `priority`, `status`  | `-created_at` |
| `filter[status]`              | string | Lọc theo trạng thái. Enum: `OPEN`, `RECEIVED`, `IN_PROGRESS`, `WAITING_PARTS`, `DONE`, `CANCELLED` | `OPEN`        |
| `filter[priority]`            | string | Lọc theo độ ưu tiên. Enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT`                                       | `HIGH`        |
| `filter[property_id]`         | uuid   | Lọc theo Tòa nhà                                                                                   | `uuid`        |
| `filter[room_id]`             | uuid   | Lọc theo Phòng                                                                                     | `uuid`        |
| `filter[assigned_to_user_id]` | uuid   | Nhân viên xử lý                                                                                    | `uuid`        |
| `filter[contract_id]`         | uuid   | Hợp đồng liên quan                                                                                 | `uuid`        |

---

## Traits sử dụng

- **`HasUuids`**: Primary key dùng UUID.
- **`SoftDeletes`**: Hỗ trợ xóa mềm.
- **`MultiTenant`**: Global scope theo `org_id`.
- **`SystemLoggable`**: Ghi audit log tự động (tích hợp Activity Log).

---

## Test Coverage

**File test:** `tests/Feature/Ticket/TicketTest.php`  
**Tổng test cases:** **51 passed** (131 assertions)

**Phạm vi kiểm thử:**

- ✅ CRUD cơ bản (tạo, xem, sửa, xóa)
- ✅ Phân quyền RBAC (Owner, Manager, Staff, Tenant)
- ✅ Tenant scope isolation (không xem được ticket người khác)
- ✅ Org scope isolation (không CRUD ticket org khác)
- ✅ Status transitions (OPEN → DONE, reopen)
- ✅ Auto-fill `closed_at` / clear `closed_at`
- ✅ Event logging (CREATED, STATUS_CHANGED, COMMENT)
- ✅ Cost management (add cost, validation)
- ✅ Filtering (property_id, status, priority)
- ✅ Search (description, category)
- ✅ Validation (required fields, invalid enums, negative amounts)

---

## Design Notes

1. **Auto-Detection Logic**:
    - Nếu không truyền `contract_id`, TicketService sẽ tự tìm hợp đồng ACTIVE của phòng.
    - Status mặc định: `OPEN`, Priority mặc định: `MEDIUM`.

2. **Timeline Events**:
    - Mỗi ticket có 1 list TicketEvents (polymorphic or direct relation).
    - Type `CREATED` tự động ghi khi tạo ticket.
    - Type `STATUS_CHANGED` tự động ghi khi đổi status.
    - Type `COMMENT` do user thêm thủ công.

3. **Cost Tracking**:
    - Chỉ được thêm chi phí khi ticket đang "hoạt động" (IN_PROGRESS, WAITING_PARTS, DONE).
    - `payer` xác định bên chịu chi phí (OWNER hoặc TENANT) → dùng cho tính toán invoice.

4. **Tenant Scoping**:
    - Tenant không bao giờ thấy ticket của người khác (hard scope trong controller + policy).
    - Owner/Manager/Staff thấy tất cả tickets trong org (MultiTenant global scope).

5. **Staff Permissions**:
    - Staff được phép đổi trạng thái (`updateStatus`) và thêm comment (`addEvent`).
    - Staff KHÔNG được phép sửa (`update`) hoặc xóa (`delete`) ticket.
    - Chỉ Owner/Manager mới có full CRUD rights.

---

## API Documentation

API được tự động gen bởi **Scramble** từ PHPDoc annotations trong `TicketController`.  
🔗 Truy cập: **`/docs/api`** → Section **"Quản lý Phiếu Sự cố"**

**Endpoints được document:**

- ✅ `GET /api/tickets` (Danh sách + filters)
- ✅ `GET /api/tickets/{id}` (Chi tiết + events + costs)
- ✅ `POST /api/tickets` (Tạo phiếu)
- ✅ `PUT /api/tickets/{id}` (Cập nhật)
- ✅ `DELETE /api/tickets/{id}` (Xóa)
- ✅ `PUT /api/tickets/{id}/status` (Đổi trạng thái)
- ✅ `POST /api/tickets/{id}/events` (Thêm comment)
- ✅ `POST /api/tickets/{id}/costs` (Ghi chi phí)

---

## Checklist tích hợp hoàn tất

- [x] Model + Migration + Factory (Ticket, TicketEvent, TicketCost)
- [x] Service layer (`TicketService` với logic phức tạp)
- [x] Controller (TicketController - thin, 9 methods)
- [x] FormRequests (5 classes: Index, Store, Update, Status, EventStore, CostStore)
- [x] Resources (3 classes: TicketResource, TicketEventResource, TicketCostResource)
- [x] Policy (`TicketPolicy` implements `RbacModuleProvider`)
- [x] RBAC sync (5 permissions: create, view, viewAny, update, delete)
- [x] Routes (`routes/api/ticket.php` - 8 routes)
- [x] Tests (51 test cases, 131 assertions)
- [x] API Documentation (Scramble annotations đầy đủ)
- [x] Module Documentation (`docs/modules/09_ticket.md`)
- [x] Code formatting (Laravel Pint passed)

**Status:** ✅ **Production-Ready**
