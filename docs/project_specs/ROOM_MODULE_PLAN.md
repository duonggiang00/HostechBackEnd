# Kế hoạch Hoàn thiện Module Room (Property & Room Module)

Dựa trên phân tích `database.dbml` và source code hiện tại, module `Property` đã đi được một nửa chặng đường nhưng vẫn còn thiếu 2 mảnh ghép quan trọng để khép kín chu trình Quản lý Phòng ốc.

## Tình trạng hiện tại của Module Room
*Đã hoàn thiện (`[x]`):*
- `properties` (Tòa nhà) -> Model, Controller đầy đủ.
- `floors` (Tầng) -> Model, Controller đầy đủ.
- `rooms` (Phòng) -> Model, Controller đầy đủ.
- `room_prices` (Biến động giá) -> Model tồn tại.
- `room_status_histories` (Lịch sử trạng thái phòng) -> Model tồn tại.

*Còn thiếu (`[ ]`):*
- `room_assets` (Tài sản gắn liền với phòng) -> **Đã có Model (`RoomAsset.php`) nhưng CHƯA có Controller hay Logic API.**
- `floor_plans` (Bản đồ / Sơ đồ mặt bằng để gắn vị trí phòng) -> **Chưa có KHUNG MÃ nào.**

---

## Các Bước Triển Khai (Dự kiến)

### Giai đoạn 1: Phát triển Quản lý Tài sản Phòng (`RoomAsset`)
Mục đích: Giúp ban quản lý theo dõi điều hòa, bình nóng lạnh, nội thất có sẵn trong từng phòng trước khi khách thuê vào ở.

1. **Tạo Form Requests Validation**
   - `RoomAssetStoreRequest`: Cần validate `name`, `serial`, `condition`, `purchased_at`, `warranty_end`, `note`.
   - `RoomAssetUpdateRequest`

2. **Dựng Resource**
   - `RoomAssetResource`: Format lại ngày tháng và tình trạng tài sản.

3. **Cấu trúc lại API Controller (`RoomAssetController.php`)**
   - Viết các hàm CRUD cơ bản (Index, Store, Show, Update, Destroy).
   - Thêm Dedoc Scramble `@queryParam` chuẩn theo `API_DOCS.md`.
   - Lưu ý: Route nên để dạng lồng (Nested) ví dụ: `GET /api/rooms/{room}/assets` để lấy thiết bị theo phòng.

### Giai đoạn 2: Phát triển Mặt bằng tầng (`FloorPlan`)
Mục đích: Cho phép ban quản lý tải ảnh lên làm bản đồ nền, sau đó rải định vị các phòng (dưới dạng cấu trúc JSON mapping `{x,y,w,h}`) để hiển thị một bản đồ tương tác đẹp đẽ cho app.

1. **Dựng Khung Cơ Bản (Scaffold)**
   - Chạy lệnh `make:model Property\FloorPlan -mfs` để sinh Model và Migration.
   - Thêm cột vào Migration theo chuẩn DBML: `property_id`, `floor_id`, `image_path` (hay dùng Spatie Media), `room_mappings` (JSON), `version`.

2. **Cấu hình Model & Spatie MediaLibrary**
   - Sử dụng Spatie MediaLibrary trait `InteractsWithMedia` cho ảnh mặt bằng.
   - Ép kiểu cột `room_mappings` thành mảng JSON qua thuộc tính `$casts`.

3. **Tạo Form Requests Validation**
   - `FloorPlanStoreRequest` / `FloorPlanUpdateRequest`.
   - Validate chuỗi JSON `room_mappings` để tuân thủ một Array định dạng tọa độ.

4. **Tạo API Controller (`FloorPlanController.php`)**
   - Triển khai CRUD theo chuẩn Service.

### Giai đoạn 3: Tích hợp hình ảnh bằng `Spatie MediaLibrary`
Mục đích: Thay vì lưu đường link ảnh vào bảng riêng như thiết kế cũ lạc hậu, chúng ta sẽ ứng dụng cấu trúc Spatie `media` đa hình mới.
1. Cho phép thêm nhiều ảnh (Photos) đại diện cho từng `Room` qua `POST /api/rooms/{room}/media`.
2. Tạo Endpoint cho Mobile app/Admin xem thư viện ảnh phòng.

---

**[Review Needed]**
Kế hoạch này sẽ đáp ứng 100% các tiêu chí của nhóm `Property_Management` trong Checklist. User có thể đồng ý để bắt đầu từ **Giai đoạn 1 (Tài sản Phòng - RoomAsset)** ngay.
