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

## Handover Endpoints

| Method | Endpoint | Chức năng | Role cần thiết |
|--------|----------|-----------|----------------|
| `GET`    | `/api/handovers` | Danh sách biên bản | Owner, Manager, Staff, Tenant* |
| `POST`   | `/api/handovers` | Tạo biên bản mới (DRAFT) | Owner, Manager, Staff |
| `GET`    | `/api/handovers/{id}` | Chi tiết biên bản (kèm items/snapshots) | Owner, Manager, Staff, Tenant* |
| `POST`   | `/api/handovers/{id}/confirm` | Chốt biên bản (Locked) | Owner, Manager, Staff |

---

## 🎨 Hướng dẫn Frontend (Frontend Guide)

### 1. Công việc cần làm (Tasks)
- [ ] **Kiểm tra bàn giao (Checklist)**:
    - Hiển thị danh mục tài sản/vật tư cần bàn giao.
    - Nút "Đạt" / "Không đạt" kèm ghi chú hư tổn.
    - Upload ảnh bằng chứng tình trạng lúc bàn giao (Media).
- [ ] **Chốt chỉ số đầu/cuối**:
    - Nhập chỉ số Điện/Nước tại thời điểm nhận/trả phòng.
- [ ] **Ký xác nhận (Digital Signature)**:
    - Giao diện ký tên trực tiếp trên màn hình (Canvas).
    - Hoặc chụp ảnh chữ ký thực tế.
    - Xuất file Biên bản bàn giao dạng PDF.

### 2. Query Parameters (Filters & Search)
*Endpoint: `GET /api/handovers`*

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `search` | string | Tìm theo mã hợp đồng, tên khách thuê |
| `filter[type]` | string | `CHECK_IN`, `CHECK_OUT` |
| `filter[property_id]` | uuid | Lọc theo tòa nhà |
| `sort` | string | `handover_date`, `created_at` |
| `page`, `per_page` | int | Chuẩn phân trang |

### 3. Dữ liệu gửi lên (Request Example)
**POST `/api/handovers`**
```json
{
  "contract_id": "...",
  "type": "CHECK_IN",
  "handover_date": "2024-03-01",
  "items": [
    { "asset_id": "...", "status": "GOOD", "note": "Mới 100%" }
  ],
  "meter_snapshots": [
    { "meter_id": "...", "value": 150.5 }
  ]
}
```

### 4. Dữ liệu trả về (Response Example)
**GET `/api/handovers`**
```json
{
  "data": [
    {
      "id": "...",
      "type": "CHECK_IN",
      "handover_date": "2024-03-01",
      "contract": { "contract_number": "CON-001" },
      "status": "COMPLETED"
    }
  ],
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 1
  }
}
```

---

## 🔐 Phân quyền RBAC (Frontend Logic)

| Role | Chức năng hiển thị | Ghi chú |
|------|--------------------|---------|
| **Owner** | View & Confirm | Thường chỉ xem kết quả cuối cùng |
| **Manager** | CRUD & Confirm | Quản lý trực tiếp quá trình bàn giao |
| **Staff** | Create & Update Items | Nhân viên đi kiểm tra thực tế tại phòng |
| **Tenant** | View Only | Xem biên bản đã được chốt (không thể sửa) |

---

## Phân quyền RBAC (Backend Policy)

| Hành động | Owner | Manager | Staff | Tenant |
|-----------|-------|---------|-------|--------|
| Create Handover | ✅ | ✅ | ✅ | ❌ |
| Update Items/Snapshots | ✅ | ✅ | ✅ | ❌ |
| Confirm Handover | ✅ | ✅ | ✅ | ❌ |
| View Handover | ✅ | ✅ | ✅ | 🔶 own room |

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
