# Kế Hoạch Tích Hợp: Điều Chỉnh Chỉ Số Đồng Hồ & Thư Viện Hình Ảnh (Meter Adjustments & Media Library)

Tài liệu này vạch ra chiến lược tích hợp bảng `adjustment_notes` vào Module Đồng hồ (Meter), đồng thời áp dụng thư viện `spatie/laravel-medialibrary` (đã được thống nhất trong `IMAGE_UPLOAD_STRATEGY.md`) để đính kèm hình ảnh làm bằng chứng (Proof Images) cho chỉ số đồng hồ thực tế.

## 1. Mục đích và Bài toán Nghiệp vụ

*   **Bài toán 1**: Khi chủ nhà hoặc nhân viên ghi nhầm chỉ số Điện/Nước và đã lỡ chốt sổ (`LOCKED`), họ không thể tự do sửa lại số (vì có thể ảnh hưởng đến hóa đơn). Hệ thống cần một phương thức **Xin phép Điều chỉnh** minh bạch qua bảng `adjustment_notes`.
*   **Bài toán 2**: Bất cứ khi nào ghi số mới (Meter Reading) hoặc xin điều chỉnh số (Adjustment Note), người ghi số phải đính kèm **Ảnh chụp đồng hồ thực tế**. Tính năng này đòi hỏi chúng ta phải móc nối Spatie Media Library vào 2 Model: `MeterReading` và `AdjustmentNote`.

---

## 2. Kế hoạch Tích hợp Media Library (Ảnh Dẫn Chứng)

Dựa theo chiến lược đã chốt, chúng ta sẽ không dùng bảng `photos` thủ công mà ủy quyền hoàn toàn cho `Spatie\MediaLibrary`.

### A. Tích hợp Model
Hai Model cần được gắn trait `HasMedia` và triển khai `InteractsWithMedia`:
1.  **`App\Models\Meter\MeterReading`**:
    *   **Thêm trait**: `implements HasMedia` & `use InteractsWithMedia`.
    *   **Media Collection**: Tạo một collection tên là `reading_proofs`. Các thiết lập:
        *   Tối đa n ảnh (thường 1-2 ảnh cho 1 lần chốt).
        *   Tự tạo bản thu nhỏ (Thumbnail size) để load danh sách nhanh.
2.  **`App\Models\Meter\AdjustmentNote`**:
    *   **Thêm trait**: `implements HasMedia` & `use InteractsWithMedia`.
    *   **Media Collection**: Tạo một collection tên là `adjustment_proofs`. (Hình ảnh đồng hồ mới đính kèm cùng thư xin lỗi).

### B. Upload Workflow
Hệ thống sẽ giữ thiết kế Upload qua một API tập trung (VD: `MediaController` / `UploadController`), sau đó gắn `media_id` vào các payload lúc Submit.
*   Khi submit "Chốt sổ" (`POST /api/meter-readings`), payload có dạng: `['meter_id' => '...', 'reading_value' => 123, 'proof_media_ids' => [uuid1]]`.
*   Khi submit "Xin sửa số" (`POST /api/meter-readings/{id}/adjustments`), payload có dạng: `['after_value' => 100, 'reason' => '...', 'proof_media_ids' => [uuid2]]`.
*   **Service**: Các Service `MeterReadingService` sẽ chịu trách nhiệm dò mảng IDs và Attach media vật lý vào Model.

---

## 3. Quy trình Tích hợp `AdjustmentNote` (Xin sửa số)

Bảng `adjustment_notes` đóng vai trò là "Ticket" xin phép.

### A. Lifecycle (Vòng đời của Note)
1.  **Create (Tạo Yêu cầu)**:
    *   Người dùng (Owner/Manager/Staff) POST thông tin yêu cầu sửa cho 1 `meter_reading_id` đã bị khóa.
    *   Tự động lưu `before_value` bốc từ DB gốc. Lưu `after_value` từ Request.
    *   Trạng thái ngầm định lúc tạo là: Chờ duyệt (Chưa có `approved_at`).
2.  **Approve (Chấp thuận)**:
    *   Chỉ Owner/Manager (người có quyền cao hơn) có thể gọi lệnh (PUT) Approve.
    *   **Hook Xử Lý 1**: Điền `approved_by_user_id` và `approved_at = now()`.
    *   **Hook Xử Lý 2 (Core Business)**: Quay ngược lại chọc vào `App\Models\Meter\MeterReading`, đè giá trị `reading_value = adjustment_notes.after_value`.
    *   **Hook Xử Lý 3 (Financial)**: Nếu tháng này Hóa đơn MỚI CHỈ DRAFT (Chưa phát hành), lập tức quét các loại dịch vụ có `code` DIEN/NUOC và `calc_mode = PER_METER` trong `invoice_items` để Cập nhật tiền giảm xuống/tăng lên tương ứng với số Kwh / M3 bị lệch.

### B. Restful API Design
Nested resource là lựa chọn tốt nhất.
*   `POST /api/meter-readings/{reading}/adjustments` (Gửi phiếu xin sửa).
*   `GET /api/meter-readings/{reading}/adjustments` (Xem lại các lần đã xin sửa).
*   `PUT /api/meter-readings/{reading}/adjustments/{adjustment}/approve` (Duyệt điều chỉnh).

### C. Resource Responses
Cần nâng cấp `MeterReadingResource` để API Trả về đầy đủ:
*   Bản chụp chốt số đồng hồ (Media URL, Thumbnail).
*   Đính kèm mảng Adjustments bên trong payload để FE vẽ lịch sử chỉnh số nếu bị sai lệch.

---

## 4. Các bước Lập trình
1.  **Spatie Setup**: Đảm bảo package đã được cấu hình và Migrate Media Table đầy đủ (nếu chưa có).
2.  **Model Traits**: Sửa trực tiếp file `MeterReading.php` và `AdjustmentNote.php` để nhét interface `HasMedia`.
3.  **Controllers & Routes**: Tạo `AdjustmentNoteController` để điều hướng Request.
4.  **Service (Action)**: Viết các Core logic thay đổi số khi Approve trong file (Ví dụ: `MeterReadingAdjustmentService.php`).
5.  **Test Case**: Viết Unit (Feature) Test cho luồng Xin sửa số -> Cập nhật số liệu.

Tài liệu này là cam kết kỹ thuật trước khi Code. Mọi phương pháp tiếp cận đều đã được cân nhắc để phù hợp với chuẩn hóa dự án hệ thống lớn.
