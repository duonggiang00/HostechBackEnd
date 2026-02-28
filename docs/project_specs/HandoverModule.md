# Kế hoạch & Kiến trúc hệ thống Module Handover (Bàn giao/Kiểm kê)

Tài liệu này định nghĩa chi tiết API và cấu trúc hệ thống của Module Handover dựa trên schema database, chuẩn mực RESTful API và mô hình phân quyền (RBAC) của dự án. Đặc biệt chú trọng vào việc tích hợp Media đính kèm (Hình ảnh chứng minh).

## 1. Tổng quan Models
- **Handover**: Thực thể gốc, lưu trữ biên bản bàn giao tổng quát (loại hợp đồng, trạng thái DRAFT/CONFIRMED, ghi chú, chữ ký số). Tích hợp Media lưu bản scan biên bản chữ ký tay.
- **HandoverItem**: Danh sách thiết bị/tình trạng hiện tại lúc thao tác. Tích hợp Media lưu ảnh chụp thiết bị hỏng hoặc hiện trạng phòng. Có thể móc nối tới `room_assets`.
- **HandoverMeterSnapshot**: Lưu chốt số điện nước lúc dọn vào/ra. Tích hợp Media chốt ảnh đồng hồ.

## 2. RBAC Phân quyền & Scopes Mặc định (Dynamic Scope)

Module Handover tuân thủ chặt chẽ mô hình **Dynamic Scope** dựa trên MultiTenant.

| Role | Quyền hạn mặc định API Handover | Scope Data |
| :--- | :--- | :--- |
| **Admin** | Đầy đủ quyền, không bị giới hạn Scope | Tất cả các Org. |
| **Owner** | Đầy đủ quyền CRUD | Toàn bộ biên bản thuộc Org của họ. |
| **Manager** | View, Create, Update, Export (Không được Xóa Biên bản đã confirm) | Biên bản nằm trong các Properties được phân quyền quản lý. |
| **Staff** | View, Cập nhật trạng thái item, thêm item | Tương tự Manager, quyền được cấp khi làm nhiệm vụ Checkin/Checkout cho khách. |
| **Tenant** | View (Chỉ xem biên bản đã Confirm) | Chỉ thấy biên bản gắn với hợp đồng thuê của họ. |

## 3. Kiến trúc API Endpoints (`HandoverController`)

### `GET /api/handovers`
- **Mô tả**: Lấy danh sách biên bản bàn giao.
- **Quyền**: Mọi role đều được xem (dựa trên Scope).
- **Bộ lọc**: 
  - `filter[type]`: CHECKIN, CHECKOUT.
  - `filter[status]`: DRAFT, CONFIRMED.
  - `filter[room_id]`, `filter[contract_id]`.
  - `include`: `room`, `contract`, `confirmedBy`.
- **Response trả về (`HandoverResource::collection`)**:
  ```json
  {
    "data": [
      {
        "id": "uuid-handover",
        "type": "CHECKIN",
        "status": "DRAFT",
        "note": "Bàn giao phòng cho khách mới",
        "confirmed_at": null,
        "created_at": "2026-02-28T14:00:00Z",
        "room": {
          "id": "uuid-room",
          "code": "A101"
        },
        "media_urls": []
      }
    ],
    "meta": { "current_page": 1, "last_page": 2, "total": 15 }
  }
  ```

### `POST /api/handovers`
- **Mô tả**: Tạo mới 1 biên bản bàn giao DRAFT. (Thường tự động sinh khi tạo hợp đồng, nhưng hỗ trợ tạo tay).
- **Body (`HandoverStoreRequest`)**:
  ```json
  {
    "room_id": "uuid-room",
    "contract_id": "uuid-contract",
    "type": "CHECKIN",
    "note": "Cần kiểm tra kỹ cục nóng điều hòa"
  }
  ```
- **Response trả về**: 
  Trả về `HandoverResource` của bản ghi vừa tạo.

### `GET /api/handovers/{id}`
- **Mô tả**: Xem chi tiết biên bản.
- **Include**: `items`, `items.media` (ảnh đồ đạc), `meterSnapshots`, `meterSnapshots.media` (ảnh đồng hồ), `media` (ảnh biên bản gốc).
- **Response trả về (`HandoverResource`)**:
  ```json
  {
    "data": {
      "id": "uuid-handover",
      "type": "CHECKIN",
      "status": "DRAFT",
      "note": null,
      "items": [
        {
          "id": "uuid-item-1",
          "name": "Điều hòa Samsung",
          "status": "OK",
          "condition_photo_urls": ["https://s3.url/photo1.jpg"]
        }
      ],
      "meter_snapshots": [
        {
           "id": "uuid-snapshot-1",
           "meter": { "type": "ELECTRIC", "code": "E01" },
           "reading_value": 1500,
           "meter_photo_urls": ["https://s3.url/meter.jpg"]
        }
      ],
      "document_scan_urls": []
    }
  }
  ```

### `PUT /api/handovers/{id}`
- **Mô tả**: Cập nhật thông tin chung biên bản. (Chỉ cho phép khi ở trạng thái DRAFT).
- **Body (`HandoverUpdateRequest`)**:
  ```json
  {
    "note": "Đã check lại điều hòa chạy ngon"
  }
  ```
- **Response trả về**: `HandoverResource` đã update.

### `POST /api/handovers/{id}/confirm`
- **Mô tả**: Chốt sổ biên bản bàn giao. Ngăn chặn mọi hành động chỉnh sửa sau này.
- **Hành động liên đới (Service Layer)**: 
  - Đổi status thành `CONFIRMED`. 
  - Gán `confirmed_by_user_id` bằng User hiện tại.
  - Set `confirmed_at` và `locked_at`.
- **Body**: Rỗng `{}`
- **Response trả về**: `HandoverResource` với `status` = `CONFIRMED`.

### Quản lý Handover Items (Chi tiết kiểm kê)

#### `GET /api/handovers/{id}/items`
- **Mô tả**: Lấy danh mục đang kiểm kê. Trả về kèm Collection URLs của Spatie Media.

#### `POST /api/handovers/{id}/items`
- **Mô tả**: Thêm đồ vào danh sách kiểm kê biên bản.
- **Body (`HandoverItemStoreRequest`)**: 
  ```json
  {
    "room_asset_id": null,
    "name": "2 Thẻ từ thang máy",
    "status": "OK",
    "note": "Khách đã nhận đủ 2 thẻ"
  }
  ```
- **Response trả về (`HandoverItemResource`)**:
  ```json
  {
    "data": {
      "id": "uuid-new-item",
      "name": "2 Thẻ từ thang máy",
      "status": "OK",
      "note": "Khách đã nhận đủ 2 thẻ",
      "condition_photo_urls": []
    }
  }
  ```

#### `PUT /api/handovers/{id}/items/{item_id}`
- **Mô tả**: Cập nhật tình trạng thiết bị (Ví dụ từ OK đổi sang DAMAGED).
- **Body (`HandoverItemUpdateRequest`)**:
  ```json
  {
    "status": "DAMAGED",
    "note": "Cửa tủ quần áo bị trầy xước nhẹ"
  }
  ```
- **Response trả về**: `HandoverItemResource` đã update.

#### `DELETE /api/handovers/{id}/items/{item_id}`
- **Mô tả**: Xóa item khỏi biên bản DRAFT.

### Quản lý Snapshots (Chốt đồng hồ)

#### `GET /api/handovers/{id}/snapshots`
- Lấy danh sách chốt đồng hồ kèm hình ảnh.

#### `POST /api/handovers/{id}/snapshots`
- **Mô tả**: Cập nhật/Tạo snapshot cho một đồng hồ.
- **Body (`HandoverMeterSnapshotRequest`)**: 
  ```json
  {
    "meter_id": "uuid-meter",
    "reading_value": 2540
  }
  ```
- **Response trả về (`HandoverMeterSnapshotResource`)**:
  ```json
  {
    "data": {
      "id": "uuid-snapshot",
      "meter_id": "uuid-meter",
      "reading_value": 2540,
      "meter_photo_urls": []
    }
  }
  ```

### Tích hợp Upload Media (Files)

Sử dụng endpoint riêng biệt hoặc multipart/form-data trực tiếp:
- **`POST /api/handovers/{id}/media`**: Upload bản scan Hợp đồng chữ ký tay (collection: `document_scans`).
- **`POST /api/handovers/items/{item_id}/media`**: Upload hình ảnh chứng minh tình trạng (collection: `condition_photos`).
- **`POST /api/handovers/snapshots/{snapshot_id}/media`**: Upload hình đồng hồ (collection: `meter_photos`).
- **Data (Multipart Form)**: `file` (File đính kèm: png, jpg, pdf...).
- **Response trả về**:
  ```json
  {
    "message": "Upload thành công",
    "media_url": "https://s3.url/files/123/hinh_anh.jpg"
  }
  ```

## 4. Kiến trúc Service Layer (`HandoverService`)

Tách biệt logic xử lý hệ thống:
- **`paginate()`**: Sử dụng `Spatie\QueryBuilder`.
- **`createDraft(array $data)`**: Tạo biên bản nháp, có thể tự động clone danh sách tài sản từ `room_assets` sang `handover_items` nếu hệ thống cấu hình.
- **`confirm(Handover $handover)`**: Khóa biên bản, validate bắt buộc các field quan trọng phải có ảnh đính kèm (nếu cần).

## 5. DTO API Resources

Chịu trách nhiệm format lại dữ liệu JSON trước khi trả về Frontend:
- **`HandoverResource`**:
  - Auto format URLs của Spatie Media: `media_urls: $this->getMedia('document_scans')->map->getUrl()`.
- **`HandoverItemResource`**:
  - Kèm media URLs (ảnh hiện trạng).
- **`HandoverMeterSnapshotResource`**:
  - Kèm media URLs (ảnh đồng hồ).
