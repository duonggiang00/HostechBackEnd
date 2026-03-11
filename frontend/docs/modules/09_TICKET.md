# Module: Phiếu Sự cố (Ticket)

## Tổng quan
Module xử lý các yêu cầu sửa chữa, khiếu nại hoặc đề xuất từ khách thuê (Tenant) tới Ban quản lý.

**Controllers:**
- `App\Http\Controllers\Api\Ticket\TicketController`
- `App\Http\Controllers\Api\Ticket\TicketCommentController`

**Services:**
- `App\Services\Ticket\TicketService`

**Policies:**
- `App\Policies\Ticket\TicketPolicy`

---

## Ticket Endpoints

| Method | Endpoint | Chức năng | Role |
|--------|----------|-----------|------|
| `GET`    | `/api/tickets` | Danh sách phiếu | All roles |
| `POST`   | `/api/tickets` | Tạo phiếu mới | All roles |
| `GET`    | `/api/tickets/{id}` | Chi tiết phiếu | All roles |
| `PUT`    | `/api/tickets/{id}` | Cập nhật thông tin | Manager, Staff |
| `PUT`    | `/api/tickets/{id}/status` | Chuyển trạng thái | Manager, Staff |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Gửi yêu cầu (Thanh dành cho Khách thuê)**:
    - Form tạo ticket: Tiêu đề, Loại sự cố (`MAINTENANCE`, `COMPLAINT`), Nội dung mô tả.
    - Đính kèm hình ảnh/video thực tế (Sử dụng module Media).
- [ ] **Quản lý xử lý (Bảng điều khiển cho Staff)**:
    - Kanban Board hoặc Danh sách phân loại theo trạng thái.
    - Giao diện "Tiếp nhận" và "Cập nhật tiến độ".
    - Nhập chi phí vật tư nếu có (Lưu vào meta hoặc table liên kết).
- [ ] **Hệ thống phản hồi (Comments)**:
    - Luồng chat giữa Khách thuê và Nhân viên ngay trong ticket.
    - Thông báo đẩy (hoặc badge số đỏ) khi có bình luận mới.

### 2. Trạng thái phiếu (Status Flow)
Frontend nên hiển thị màu sắc tương ứng:
- **`OPEN`**: Mới tạo, chờ xử lý.
- **`IN_PROGRESS`**: Đang sửa chữa/xử lý.
- **`RESOLVED`**: Đã xử lý xong, chờ khách xác nhận.
- **`CLOSED`**: Đã đóng hoàn tất.
- **`CANCELLED`**: Đã hủy.

### 3. Query Parameters (Filters)
| Parameter | Type | Mô tả |
|-----------|------|-------|
| `filter[status]` | string | Lọc theo trạng thái |
| `filter[type]` | string | Lọc loại sự cố |
| `filter[priority]` | string | `low`, `normal`, `high`, `urgent` |

### 4. Dữ liệu gửi lên (Request Example)
**POST `/api/tickets`**
```json
{
  "title": "Hỏng vòi nước phòng tắm",
  "description": "Vòi bị rò rỉ nước liên tục từ tối qua",
  "type": "MAINTENANCE",
  "priority": "normal",
  "media_uuids": ["uuid-1", "uuid-2"]
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

- **Tenant**: Chỉ thấy và bình luận trên các ticket do chính mình tạo.
- **Staff**: Thấy các ticket được phân công hoặc trong tòa nhà mình quản lý. Có quyền đổi trạng thái sang `IN_PROGRESS`/`RESOLVED`.
- **Manager/Owner**: Thấy toàn bộ ticket, có quyền đóng (`CLOSED`) hoặc xóa ticket.
