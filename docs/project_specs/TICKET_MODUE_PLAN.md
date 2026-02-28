# Kế hoạch & Kiến trúc hệ thống Module Tickets (Sự cố/Yêu cầu)

Tài liệu này định nghĩa chi tiết API và cấu trúc hệ thống của Module Tickets (Phiếu yêu cầu/Báo cáo sự cố) dựa trên schema database và chuẩn mực RESTful API của dự án.

## 1. Tổng quan Models
- **Ticket**: Thực thể gốc, lưu trữ dữ liệu chính về sự cố (`status`, `priority`, `category`, `description`).
- **TicketEvent**: Lịch sử trao đổi, cập nhật trạng thái của Ticket.
- **TicketCost**: Chi phí phát sinh sau khi đóng / xử lý Ticket.

## 2. RBAC Phân quyền & Scopes Mặc định

Module Ticket tuân thủ chặt chẽ mô hình **Dynamic Scope** theo `RolePermission.md`. Tất cả các thao tác CRUD đều được tự động Scoped theo `org_id` thông qua trait `MultiTenant`.

| Role | Quyền hạn mặc định trên API Tickets | Scope Data |
| :--- | :--- | :--- |
| **Admin** | Đầy đủ quyền, không bị giới hạn Scope | Tất cả các Org. |
| **Owner** | Đầy đủ quyền CRUD | Toàn bộ Ticket thuộc Org của họ. |
| **Manager** | View, Update, Assign (Không được xóa Ticket) | Trong phạm vi các Property (Tòa nhà) được phân quyền. |
| **Staff** | View, Cập nhật trạng thái (In Progress, Done) | Tương tự Manager, nhưng hạn chế đổi `due_at` hay `costs`. |
| **Tenant** | Create, View, Comment (Thêm Event) | Mặc định chỉ thấy Ticket do chính họ tạo hoặc được gắn vào Room của họ. |

**Scope Logic Mapping Database:**
- Scope by Property: `property_id`
- Scope by Room: `room_id`
- Mức Tenant: Filter theo `created_by_user_id` = User đang đăng nhập hoặc `room_id` trùng khớp với hợp đồng (Contract) đang có hiệu lực.

## 3. Kiến trúc API Endpoints (`TicketController`)

### `GET /api/tickets`
- **Mô tả**: Danh sách phiếu sự cố.
- **Quyền**: Owner, Manager, Staff, Tenant.
- **Bộ lọc (QueryBuilder)**:
  - `filter[status]`: Mở, Đang xử lý, Đã đóng...
  - `filter[priority]`: LOW, MEDIUM, HIGH, URGENT.
  - `filter[property_id]`, `filter[room_id]`: Lọc theo khu vực.
  - `sort`: `-created_at`, `due_at`.
  - `search`: Theo mã vé (nếu có), hoặc keyword description.
  - `include`: `createdBy`, `assignedTo`, `property`, `room`.
- **Response trả về (TicketResource)**:
  ```json
  {
    "data": [
      {
        "id": "e29b-...",
        "category": "Điện",
        "priority": "MEDIUM",
        "status": "OPEN",
        "description": "Bóng đèn phòng khách hỏng",
        "due_at": "2026-03-01T12:00:00Z",
        "closed_at": null,
        "created_at": "2026-02-28T14:00:00Z",
        "created_by": {
          "id": "...",
          "full_name": "Nguyen Van A"
        },
        "property": {
          "id": "...",
          "name": "Chung cư X"
        },
        "room": {
          "id": "...",
          "code": "A101"
        }
      }
    ],
    "meta": {
      "current_page": 1,
      "last_page": 5,
      "total": 60
    }
  }
  ```

### `POST /api/tickets`
- **Mô tả**: Tạo mới 1 phiếu báo cáo sự cố (Từ phía Tenant hoặc Quản lý ghi nhận hộ).
- **Body (`TicketStoreRequest`)**:
  ```json
  {
    "property_id": "uuid",
    "room_id": "uuid",
    "category": "Điện",
    "priority": "HIGH",
    "description": "Bóng đèn phòng khách bị chập điện"
  }
  ```
- **Hành động liên đới (Service Layer)**:
  - Tự động gán `contract_id` nếu phòng đang có hợp đồng Active.
  - Tự sinh ra 1 record `TicketEvent` với type `CREATED`.
- **Response trả về**: Trả về TicketResource giống obj trong danh sách `GET /api/tickets`.

### `GET /api/tickets/{id}`
- **Mô tả**: Xem chi tiết 1 ticket.
- **Include**: Có thể include full `events` và `costs`.
- **Response trả về**:
  ```json
  {
    "data": {
      "id": "...",
      "status": "OPEN",
      "description": "Bóng đèn hỏng",
      "events": [
         {
           "id": "...",
           "type": "CREATED",
           "message": "Tạo phiếu yêu cầu mới",
           "created_at": "2026-02-28T14:00:00Z",
           "actor": {
              "id": "...",
              "full_name": "Nguyen Van A"
           }
         }
      ],
      "costs": []
    }
  }
  ```

### `PUT /api/tickets/{id}`
- **Mô tả**: Cập nhật thông tin cơ bản ticket (Dành cho Owner/Manager: đổi độ ưu tiên, phân công người xử lý).
- **Body (`TicketUpdateRequest`)**:
  ```json
  {
    "priority": "URGENT",
    "category": "Điện",
    "due_at": "2026-03-01 15:00:00",
    "assigned_to_user_id": "uuid_nhan_vien"
  }
  ```
- **Response trả về**: Trả về model Ticket đã cập nhật.

### `PUT /api/tickets/{id}/status`
- **Mô tả**: Chuyển trạng thái Ticket (OPEN -> IN_PROGRESS -> DONE).
- **Body (`TicketStatusRequest`)**:
  ```json
  {
    "status": "IN_PROGRESS",
    "message": "Đã tiếp nhận và cử kỹ thuật viên sang kiểm tra"
  }
  ```
- **Hành động liên đới (Service Layer)**:
  - Tự sinh record `TicketEvent` với type `STATUS_CHANGED`, lưu `message` đính kèm.
  - Nếu `status` = 'DONE', tự setup field `closed_at`.

### `POST /api/tickets/{id}/events`
- **Mô tả**: Thêm bình luận trao đổi vào Ticket.
- **Body**:
  ```json
  {
    "message": "Anh kỹ thuật báo khoảng 15p nữa có mặt nhé"
  }
  ```
  - Ghi nhận `actor_user_id` là user hiện tại, type = `COMMENT`.
- **Response trả về (`TicketEventResource`)**:
  ```json
  {
    "data": {
      "id": "...",
      "type": "COMMENT",
      "message": "Anh kỹ thuật báo khoảng 15p nữa có mặt nhé",
      "created_at": "2026-02-28T14:15:00Z"
    }
  }
  ```

### `POST /api/tickets/{id}/costs`
- **Mô tả**: Chốt chi phí sửa chữa sau khi Ticket được xử lý xong.
- **Quyền**: Owner, Manager.
- **Body (`TicketCostRequest`)**:
  ```json
  {
    "amount": 150000,
    "payer": "TENANT",
    "note": "Tiền thay bóng đèn LED"
  }
  ```
- **Response trả về (`TicketCostResource`)**:
  ```json
  {
    "data": {
      "id": "...",
      "amount": 150000.00,
      "payer": "TENANT",
      "note": "Tiền thay bóng đèn LED",
      "created_by": {
         "id": "...",
         "full_name": "Admin"
      }
    }
  }
  ```

## 4. Kiến trúc Service Layer (`TicketService`)
Mọi logic nghiệp vụ sẽ dồn vào class `App\Services\Ticket\TicketService`.
- Tránh viết logic vào Controller/Model.
- Quản lý Transaction khi cập nhật `status` đồng thời insert bảng `TicketEvent`.
- Kiểm tra tính hợp lệ về logic ví dụ: "Chỉ được đính kèm chi phí (costs) khi Ticket đã ở trạng thái DONE hoặc IN_PROGRESS".

## 5. Resources (Responses)
Sử dụng các class để trả về dữ liệu chuẩn mực:
- `TicketResource`
- `TicketEventResource`
- `TicketCostResource`
(Đảm bảo ẩn các thông tin rác, và format lại định dạng Datetime).

## 6. Chi tiết Triển khai DTO, Services và Permissions (Tham khảo MODULE_GUIDE_FULL)

### 6.1 Validation (Form Requests)

Các Form requests dưới đây sẽ đưa vào thư mục `app/Http/Requests/Ticket/` để kiểm duyệt dữ liệu nghiêm ngặt và tự document lên Dedoc qua các Annotation `@bodyParam`:

- **`TicketStoreRequest`**: Xử lý `POST /tickets` (Tạo mới ticket). Validate `property_id`, `room_id`, `description`, `category`, `priority`.
- **`TicketUpdateRequest`**: Xử lý `PUT /tickets/{id}`. Cập nhật thông tin sơ bộ (priority, category, assigned_to_user_id, due_at).
- **`TicketStatusRequest`**: Xử lý `PUT /tickets/{id}/status`. Validate field `status` và `message` (lý do) để ép đổi trạng thái.
- **`TicketEventStoreRequest`**: Xử lý `POST /tickets/{id}/events`. Validate field `message`.
- **`TicketCostStoreRequest`**: Xử lý `POST /tickets/{id}/costs`. Validate field `amount`, `payer`, `note`.

### 6.2 DTO Responses (API Resources)

Tránh trả Array / Model nguyên gốc, tạo trong `app/Http/Resources/Ticket/`:

- **`TicketResource`**: Chuẩn hóa DTO của Ticket. Bao gồm các relationships `events`, `costs`, `room`, `assignedTo` khi được include (`$this->whenLoaded(...)`).
- **`TicketEventResource`**: Trả về timeline trò chuyện/lịch sử ticket.
- **`TicketCostResource`**: Trả về dữ liệu chi phí đã chốt.

### 6.3 Phân Quyền (`TicketPolicy`)

Quy chuẩn phân quyền sẽ kế thừa `RbacModuleProvider` và nhúng `HandlesOrgScope` tại `app/Policies/Ticket/TicketPolicy.php`:

- **Role Permissions Mapping**:
  - Tên Module: `Ticket`.
  - Prefix Role Permissions cho DB:
    - Owner/Manager: `CRUD`
    - Staff: `RU`
    - Tenant: `CR` (Chỉ tạo và xem, không cho sửa metadata core).
- Cần chạy `php artisan pb:sync` sau khi hoàn tất class này để lưu DB.

### 6.4 Xử lý Nghiệp vụ (`TicketService`)

Service xử lý logic nằm tại `app/Services/Ticket/TicketService.php`. Chịu trách nhiệm quản lý DB Transaction khi cập nhật `status` đồng thời insert event:

- **Hàm `paginate()`**: Gọi `Spatie\QueryBuilder`, map các allowedFilters (`status`, `property_id`, `room_id`, `priority`) và allowedSorts.
- **Hàm `create()`**: Sinh Ticket và tự động nhét 1 event log `CREATED`.
- **Hàm `updateStatus()`**: Cập nhật `status`, sinh 1 event log (`STATUS_CHANGED`), và tự fill `closed_at` nếu `status == 'DONE'`.
- **Hàm `addCost()`**: Tạo chi phí gắn với ticket (chỉ cho phép khi status hợp lệ).
- **Hàm `addEvent()`**: Tạo dòng bình luận trao đổi.
