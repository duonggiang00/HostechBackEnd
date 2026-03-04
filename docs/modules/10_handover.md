# Module: Bàn giao / Kiểm kê (Handover)

## Tuyến (Endpoints) & Controllers

**Controllers:**
- `App\Http\Controllers\Api\Handover\HandoverController`

**Services:**
- `App\Services\Handover\HandoverService`

**Policy:**
- `App\Policies\HandoverPolicy`

**Models:**
- `App\Models\Handover\Handover`
- `App\Models\Handover\HandoverItem`
- `App\Models\Handover\HandoverMeterSnapshot`

---

## 1. Tổng quan Models
- **Handover**: Thực thể gốc, lưu trữ biên bản bàn giao tổng quát (loại hợp đồng, trạng thái DRAFT/CONFIRMED, ghi chú, chữ ký số). Tích hợp Media lưu bản scan biên bản chữ ký tay.
- **HandoverItem**: Danh sách thiết bị/tình trạng hiện tại lúc thao tác. Tích hợp Media lưu ảnh chụp thiết bị hoặc hiện trạng phòng. Có thể móc nối tới `room_assets`.
- **HandoverMeterSnapshot**: Lưu chốt số điện nước lúc dọn vào/ra. Tích hợp Media chốt ảnh đồng hồ.

## 2. RBAC Phân quyền & Scopes Mặc định (Dynamic Scope)

Module Handover tuân thủ chặt chẽ mô hình **Dynamic Scope** dựa trên MultiTenant.

| Role | Quyền hạn mặc định API Handover | Scope Data |
| :--- | :--- | :--- |
| **Admin** | Đầy đủ quyền, không bị giới hạn Scope | Tất cả các Org. |
| **Owner** | Đầy đủ quyền CRUD | Toàn bộ biên bản thuộc Org của họ. |
| **Manager** | View, Create, Update, Export | Biên bản nằm trong các Properties được phân quyền quản lý. |
| **Staff** | View, Cập nhật trạng thái item, thêm item | Tương tự Manager, quyền được cấp khi làm nhiệm vụ Checkin/Checkout cho khách. |
| **Tenant** | View (Chỉ xem biên bản đã Confirm) | Chỉ thấy biên bản gắn với hợp đồng thuê của họ. |

---

## 3. Kiến trúc API Endpoints (`HandoverController`)

API được tự động gen bởi **Scramble** từ PHPDoc annotations trong `HandoverController`.  
🔗 Truy cập: **`/docs/api`** → Section **"Quản lý Bàn Giao"**

### `GET /api/handovers`
- Danh sách biên bản bàn giao.
- Bộ lọc: `filter[type]`, `filter[status]`, `filter[room_id]`, `filter[contract_id]`.
- Include: `room`, `contract`, `confirmedBy`.
- Response trả về (`HandoverResource::collection`).

### `POST /api/handovers`
- Tạo mới 1 biên bản bàn giao DRAFT.

### `GET /api/handovers/{id}`
- Xem chi tiết biên bản.
- Include: `items`, `items.media`, `meterSnapshots`, `meterSnapshots.media`, `media`.

### `PUT /api/handovers/{id}`
- Cập nhật thông tin chung biên bản. (Chỉ cho phép khi ở trạng thái DRAFT).

### `POST /api/handovers/{id}/confirm`
- Chốt sổ biên bản bàn giao. Đổi status thành `CONFIRMED`.

### Quản lý Handover Items (Chi tiết kiểm kê)

- `GET /api/handovers/{id}/items`: Lấy danh mục đang kiểm kê.
- `POST /api/handovers/{id}/items`: Thêm đồ vào danh sách kiểm kê.
- `PUT /api/handovers/{id}/items/{item_id}`: Cập nhật tình trạng thiết bị (Ví dụ từ OK đổi sang DAMAGED).
- `DELETE /api/handovers/{id}/items/{item_id}`: Xóa item khỏi biên bản DRAFT.

### Quản lý Snapshots (Chốt đồng hồ)

- `GET /api/handovers/{id}/snapshots`: Lấy danh sách chốt đồng hồ.
- `POST /api/handovers/{id}/snapshots`: Cập nhật/Tạo snapshot cho một đồng hồ.

---

## 4. Test Coverage

**File test:** `tests/Feature/Handover/HandoverTest.php`  
**Tổng test cases:** Các trường hợp kiểm thử liên quan tới Handover, HandoverItems, MeterSnapshots đã được pass đầy đủ.

---

## 5. Checklist tích hợp hoàn tất

- [x] Model + Migration (Handover, HandoverItem, HandoverMeterSnapshot)
- [x] Service layer (`HandoverService` với logic confirm/check)
- [x] Controller (`HandoverController` - API chuẩn REST)
- [x] FormRequests (Index, Store, Update, ItemStore/Update, Snapshot)
- [x] Resources (HandoverResource, ItemResource, SnapshotResource)
- [x] Policy (`HandoverPolicy` tích hợp Rbac)
- [x] Tests (`HandoverTest.php`)
- [x] Code formatting (Laravel Pint passed)

**Status:** ✅ **Production-Ready**
