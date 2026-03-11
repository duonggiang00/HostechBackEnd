# Kế hoạch Triển khai Tính năng Quản lý Đồng hồ (Meter Module CRUD)

Module **Meter** đóng vai trò cực kỳ quan trọng trong việc quản lý và tính toán tiền Điên/Nước dựa trên chỉ số thực tế của từng phòng.

## 1. Nền tảng Cơ sở Dữ liệu (Đã hoàn thiện)

### Bảng liên quan trực tiếp
- `meters`: Chứa thông tin vật lý của công tơ (Mã, Loại Điện/Nước, Trạng thái hoạt động, Phòng lặp đặt).
- `meter_readings`: Chứa kỳ chốt chỉ số hàng tháng (Số đầu, số cuối, kỳ thanh toán, người chốt, người duyệt).

### Bảng liên kết (Relations)
- `rooms` (Phòng): 1 Meter luôn gắn với 1 Room cụ thể.
- `floors` (Tầng): Room thuộc về Floor.
- `properties` (Tòa nhà): Floor thuộc về Property, hoặc Room thuộc trực tiếp về Property.
- `orgs` (Tổ chức): Dùng để lọc Multi-tenant.
- `users`: Người tạo, duyệt chốt số.

---

## 2. Thiết kế API Endpoints (RESTful chuẩn hóa)

### Danh sách APIs
| HTTP Method | Endpoint | Quyền (Role) | Chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/meters` | Owner, Manager, Staff | Danh sách tất cả đồng hồ. |
| `GET` | `/api/properties/{property_id}/meters` | Owner, Manager, Staff | Danh sách đồng hồ thuộc 1 Tòa nhà. |
| `GET` | `/api/properties/{property_id}/floors/{floor_id}/meters` | Owner, Manager, Staff | Danh sách đồng hồ thuộc 1 Tầng. |
| `POST` | `/api/meters` | Owner, Manager | Thêm mới 1 đồng hồ (Gắn vào phòng). |
| `GET` | `/api/meters/{id}` | Owner, Manager, Staff | Xem chi tiết đồng hồ (Kèm cấu hình & lịch sử). |
| `PUT/PATCH` | `/api/meters/{id}` | Owner, Manager | Cập nhật Trạng thái (Bảo trì/Hoạt động) hoặc Mã ngầm. |
| `DELETE` | `/api/meters/{id}` | Owner, Manager | Gỡ bỏ đồng hồ (Soft Delete). |

*(Lưu ý: CRUD cho bảng `meter_readings` (Thêm số điện nước hàng tháng) sẽ được quy hoạch thành tính năng con lồng vào trong Meter hoặc thành Endpoint riêng biệt trong tương lai gần).*

---

## 3. Cấu trúc Xử lý Danh sách (Index)

Yêu cầu cực kỳ quan trọng là lọc đồng hồ thông qua cây phân cấp: Tòa nhà -> Tầng -> Phòng, kèm theo Search Text. 

### Các tham số URL Query (Spatie QueryBuilder)
- **Tìm kiếm `?search=...`**: Search theo `code` (Mã đồng hồ) hoặc tên Phòng.
- **Lọc theo thuộc tính đồng hồ**:
  - `?filter[type]=ELECTRIC`
  - `?filter[is_active]=1`
- **Lọc Mở rộng (Cây phân cấp nhà):** Sử dụng `AllowedFilter::exact()` kết hợp `whereHas`.
  - `?filter[room_id]=xxx`: Lấy đồng hồ của 1 phòng.
  - `?filter[floor_id]=xxx`: Lấy tất cả đồng hồ của 1 tầng (Xuyên qua quan hệ Room).
  - `?filter[property_id]=xxx`: Lấy tất cả đồng hồ của 1 tòa nhà.
- **Sắp xếp (`?sort=...`):**
  - Mặc định: `-created_at` (Mới nhất lên trên).
  - Hỗ trợ: `installed_at`, `code`, `type`.
- **Eager Loading (`?include=...`)**: Load sẵn `room` và `room.property` để giảm queries N+1.

### 4. Dữ liệu Gửi lên (Request Struct)

**Tạo Đồng hồ (POST `/api/meters`)**
```json
{
  "room_id": "9eab4a32-1234-abcd-5678-000000000000",
  "code": "E-A101",
  "type": "ELECTRIC", 
  "installed_at": "2026-02-15",
  "is_active": true,
  "meta": {
    "brand": "Cadivi",
    "serial": "SN-098765"
  }
}
```

**Cập nhật Đồng hồ (PUT `/api/meters/{id}`)**
```json
{
  "code": "E-A101-NEW",
  "is_active": false,
  "meta": {
    "status": "BAO_TRI"
  }
}
```

### 5. Dữ liệu Trả về (Response Struct)

Sử dụng `MeterResource` + `RoomResource` (nested).
```json
{
  "data": [
    {
      "id": "e4b51...f00e",
      "code": "W-320T",
      "type": "WATER",
      "installed_at": "2025-10-01",
      "is_active": true,
      "meta": null,
      "created_at": "2026-02-20T10:00:00Z",
      "room": {
        "id": "1c2d...",
        "name": "Phòng 102",
        "floor": {
          "id": "5f6g...",
          "name": "Tầng 1"
        },
        "property": {
          "id": "9h8j...",
          "name": "Bình Thạnh Tower" 
        }
      }
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
   - `app/Services/Meter/MeterService.php`
   - `app/Policies/Meter/MeterPolicy.php`
   - `app/Http/Requests/Meter/MeterStoreRequest.php`
   - `app/Http/Requests/Meter/MeterUpdateRequest.php`
   - `app/Http/Resources/Meter/MeterResource.php`
   - `app/Http/Controllers/Api/Meter/MeterController.php`

2. **Cấu hình Policy (`MeterPolicy.php`)**:
   - Khai báo Interface `RbacModuleProvider`.
   - Setup `Rule`: Chủ nhà (`Owner`), Quản lý (`Manager`) có quyền CRUD. Nhân sự (`Staff`) chỉ được Read. Đảm bảo Scope `checkOrgScope`.

3. **Cấu hình Service (`MeterService.php`)**:
   - Dùng Spatie Builder cho hàm `$this->paginate(...)`.
   - Viết Custom Filter (Bộ lọc nội bộ mở rộng) để cho phép Spatie lọc qua Eloquent Relations (Room -> Floor -> Property).
   ```php
   AllowedFilter::callback('property_id', function ($query, $value) {
       $query->whereHas('room', function ($q) use ($value) {
           $q->where('property_id', $value);
       });
   });
   ```

4. **Khai báo Route List (`routes/api.php`)**:
   ```php
   // API lấy danh sách theo cấu trúc cây
   Route::get('properties/{property_id}/meters', [MeterController::class, 'indexByProperty']);
   Route::get('properties/{property_id}/floors/{floor_id}/meters', [MeterController::class, 'indexByFloor']);
   
   // CRUD cơ bản
   Route::apiResource('meters', MeterController::class);
   ```

5. **Đồng bộ Quyền hạn (Sync RBAC)**:
   - Chạy lệnh DB `php artisan rbac:sync` sau khi Policy hoàn tất.
