# Lộ trình Triển khai Module Dịch vụ (Services) - Property Scope

Kế hoạch được chia làm 2 giai đoạn chính để đảm bảo luồng vận hành từ cơ bản đến tự động hóa nâng cao.

## Giai đoạn 1: Quản trị Dịch vụ & Đơn giá (Cơ bản)

Mục tiêu: Manager có thể tạo và quản lý toàn bộ danh mục dịch vụ của tòa nhà.

### 1. Luồng tạo Dịch vụ
- **Dịch vụ giá cơ bản (Flat price):** 
  - Nhập Tên, Mã, Đơn giá cố định, Checkbox Định kỳ.
  - Gửi POST payload đơn giản lên Backend.
- **Dịch vụ giá bậc thang:**
  - Manager tích chọn "Giá tiền bậc thang".
  - **Giao diện:** Hiển thị danh sách các ô input cho từng mức. Hệ thống sẽ **đưa ra gợi ý sẵn** các mức phổ biến (0-50, 51-100...) để Manager nhấn "Áp dụng nhanh".
  - **Single Endpoint:** Toàn bộ dữ liệu dịch vụ và mảng dữ liệu bậc thang (`tiered_rates`) được gửi đồng thời trong 1 request lên Backend để xử lý transaction.

### 2. Chi tiết Công việc Giai đoạn 1

#### **Frontend (ReactV2):**
- **API & Hooks:**
  - `src/PropertyScope/features/services/api/services.ts`: Xây dựng các hàm gọi API CRUD, `toggleActive`.
  - `src/PropertyScope/features/services/hooks/useServices.ts`: React Query hooks (`useServices`, `useServiceActions`).
- **Pages & Components:**
  - `ServiceListPage.tsx`: Danh sách dịch vụ sử dụng `DataTable`, tích hợp `Switch` để cập nhật trạng thái `is_active` tức thì.
  - `ServiceForm.tsx`: 
    - Sử dụng `react-hook-form` + `zod` để validate.
    - Component `TieredRateForm`: Quản lý mảng bậc thang, hỗ trợ thêm/xóa dòng.
    - Logic "Gợi ý nhanh": Một tập hợp các Preset (Điện 6 bậc, Nước 4 bậc) để điền nhanh dữ liệu.
  - `ServiceCreatePage.tsx` & `ServiceEditPage.tsx`: Wrapper cho `ServiceForm` trên trang riêng biệt.

#### **Backend (Laravel):**
- **Controller & Service:**
  - Đảm bảo `ServiceController` và `ServiceService` xử lý đúng `org_id` từ người dùng hiện tại (Auth User).
  - Kiểm tra lại logic `ServiceService@update` để đảm bảo khi cập nhật giá bậc thang, hệ thống xóa các bậc cũ và chèn bậc mới một cách an toàn (Atomic).
- **Resources:**
  - `ServiceResource`: Đảm bảo trả về đầy đủ `currentRate` và `tieredRates` để Frontend hiển thị đúng dữ liệu khi sửa.

### 3. Quản lý Danh sách (Vị trí)
- Di chuyển menu vào: **Thiết lập -> Dịch vụ**.
- Toàn bộ thao tác Thêm/Sửa dùng trang riêng (No Modal).

## Giai đoạn 2: Liên kết & Đồng bộ Tòa nhà (Nâng cao)

Mục tiêu: Kết nối Dịch vụ với cấu hình Đồng hồ (Metering) để tự động hóa tính tiền.

### 1. Phân biệt & Liên kết Đồng hồ
Hệ thống sẽ dựa vào các trường dữ liệu hiện có để tách biệt đối tượng:
- **Đồng hồ Phòng:** Có gán `room_id`.
- **Đồng hồ Tòa nhà (Master):** `room_id` để trống và `is_master = true`.

### 2. Thiết lập Dịch vụ Mặc định
- Bổ sung tab "Cấu hình mặc định" trong phần thiết lập Tòa nhà (Property Settings).
- Cho phép chọn Dịch vụ mặc định cho từng loại (Điện, Nước, Rác...).
- Lưu vào bảng `property_default_services` đã có sẵn trong cấu trúc DB.

### 3. Công cụ Khớp nối Hàng loạt (Bulk Link Tool)
- Tại trang chi tiết Dịch vụ, Manager có thể chọn: **"Áp dụng dịch vụ này cho toàn bộ đồng hồ [Loại]"**.
- **Cơ chế xử lý:**
  - Nếu đồng hồ **chưa có dịch vụ**: Tự động gán service_id mới.
  - Nếu đồng hồ **đã có dịch vụ**: Hệ thống sẽ hiển thị cảnh báo và hỏi **"Ghi đè tất cả?"** hay **"Chỉ áp dụng cho những phòng chưa có?"**.
  - Cho phép chọn phạm vi: Toàn tòa nhà / Theo Tầng / Hoặc chỉ Áp dụng cho các Đồng hồ Master (Đồng hồ tổng).

### 4. Chi tiết Công việc Giai đoạn 2

#### **Frontend (ReactV2):**
- **Settings Integration:** 
  - Bổ sung giao diện chọn "Dịch vụ mặc định" trong `PropertySettingsPage`.
- **Meter Module Enhancement:**
  - `MeterFormModal.tsx`: Thêm trường `service_id` (Select dropdown lấy dữ liệu từ Feature Services).
- **Bulk Logic UI:**
  - `BulkServiceLinkDialog.tsx`: Dialog xác nhận và cấu hình các tùy chọn (Overwrite, Scope) trước khi thực hiện liên kết hàng loạt.

#### **Backend (Laravel):**
- **API Endpoints:**
  - `POST /api/properties/{property}/meters/bulk-link-service`: Tiếp nhận `service_id`, `target_type` (Room/Building/Both), và flag `overwrite`.
- **Service Layer:**
  - `MeterService@bulkUpdateService`: Thực hiện câu lệnh SQL `update` hàng loạt trong transaction để đảm bảo hiệu năng và tính toàn vẹn dữ liệu.
- **Models:**
  - Đảm bảo relationship `defaultServices` trong `Property` model có thể đồng bộ (sync) thông qua API thiết lập tòa nhà.

---

## Giải đáp các điểm kỹ thuật

> [!IMPORTANT]
> **Dữ liệu cần bổ sung:**
> Không cần thêm cột mới vào bảng `meters`. Chúng ta sẽ tận dụng cột `service_id` sẵn có kết hợp với bảng trung gian `property_default_services` để quản lý logic "Mặc định".

> [!NOTE]
> **Về việc tách biệt Đồng hồ:**
> Luồng "Bulk Link" sẽ có Options lọc thông minh: `target_type: 'ROOM' | 'BUILDING' | 'BOTH'`. Điều này đảm bảo Manager không gán nhầm đơn giá bán lẻ cho đồng hồ tổng (nếu có đơn giá mua buôn riêng).

> [!TIP]
> **Luồng ưu tiên:**
> Dịch vụ được gán trực tiếp tại Đồng hồ (Meter-level) sẽ luôn có ưu tiên cao nhất, sau đó mới đến Dịch vụ mặc định của Tòa nhà (Property-level).
