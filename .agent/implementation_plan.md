# Kế Hoạch Chỉnh Sửa Luồng Thanh Lý Hợp Đồng & Cập Nhật UI Xác Nhận

Dưới đây là kế hoạch chi tiết để hoàn thiện luồng nghiệp vụ thanh lý hợp đồng, bao gồm việc giải quyết nợ tự động ở backend và làm rõ logic tính toán cọc ở frontend UI (Termination Wizard).

## User Review Required

> [!IMPORTANT]
> - Vui lòng kiểm tra kỹ nội dung cảnh báo / giải thích sẽ hiển thị trên UI ở Bước 3 (Step 3 Preview) của Termination Wizard xem đã sát với ngôn ngữ nghiệp vụ của bạn chưa.
> - Kế hoạch này hiện tập trung vào việc **tự động hóa** xử lý nợ sau khi thanh toán. Chức năng "Write-off (Bỏ qua nợ)" sẽ được thực hiện như một tác vụ riêng biệt sau nếu cần thiết.

## Open Questions

> [!WARNING]
> Khi Hợp đồng chuyển từ `PENDING_SETTLEMENT` sang `TERMINATED` (do khách hàng đã thanh toán hết nợ), hệ thống có cần tự động gửi thông báo (Push/Email) nào cho Manager và Tenant để xác nhận việc "Hoàn tất hợp đồng" hay không? Hiện tại plan chỉ cập nhật trạng thái hợp đồng.

## Proposed Changes

---

### Backend (Xử lý Nợ & Tự động Đóng Hợp Đồng)

Sẽ tạo mới một Listener để lắng nghe sự kiện Hóa đơn được thanh toán (`InvoicePaidEvent`), từ đó kiểm tra và tự động cập nhật trạng thái Hợp đồng nếu khách đã trả hết nợ.

#### [NEW] `CheckAndResolvePendingSettlement.php`
(Path: `backend/app/Listeners/Contract/Termination/CheckAndResolvePendingSettlement.php`)

*   **Logic:**
    *   Lắng nghe `App\Events\Finance\InvoicePaidEvent`.
    *   Lấy ra `Contract` của `Invoice` vừa được thanh toán.
    *   Kiểm tra nếu Hợp đồng đang ở trạng thái `PENDING_SETTLEMENT`.
    *   Query tổng số tiền còn nợ (`total_amount - paid_amount`) của tất cả các hóa đơn (status `ISSUED`, `PARTIAL`, `OVERDUE`) thuộc hợp đồng này.
    *   Nếu tổng nợ <= 0, tự động cập nhật trạng thái hợp đồng sang `TERMINATED`.

---

### Frontend UI (Làm rõ thông tin ở Termination Wizard)

Bổ sung các bảng giải thích và Note rõ ràng tại phần Preview để Manager hiểu tại sao tiền phòng có thể không xuất hiện trong phí thanh lý và số dư cọc được tính ra sao.

#### [MODIFY] `Step3Preview.tsx`
(Path: `frontendV2Hostech/src/PropertyScope/features/contracts/components/TerminationWizard/Step3Preview.tsx`)

*   **Bổ sung Banner Giải Thích (Info Alert):** Thêm một khối thông tin có màu nền nổi bật (ví dụ: xanh nhạt/vàng nhạt) ngay phía trên bảng tóm tắt:
    *   Hiển thị công thức: **`Số dư cọc = Tổng cọc - (Tổng nợ cũ + Phí thanh lý cuối)`**
    *   **Ghi chú quan trọng:** *"Lưu ý: Tiền phòng & dịch vụ cố định tháng cuối nếu đã được lập hóa đơn định kỳ (dù đã thanh toán hay chưa) sẽ KHÔNG bị cộng thêm vào phí thanh lý để tránh tính trùng tiền của khách."*

#### [MODIFY] `LiquidationPreviewModal.tsx`
(Path: `frontendV2Hostech/src/PropertyScope/features/contracts/components/TerminationWizard/LiquidationPreviewModal.tsx`)

*   **Bổ sung Footer / Note cho Modal:** 
    *   Khi Manager bấm xem "Chi tiết ước tính" (Preview), thêm một dòng chữ phụ ở dưới danh sách chi tiết: *"Các khoản phí định kỳ (Tiền phòng, dịch vụ cố định) có thể không hiển thị nếu đã nằm trong hóa đơn của tháng hiện tại."* giúp Manager không bị bối rối khi thấy thiếu các khoản này.

## Verification Plan

### Automated Tests
1. Xóa database và chạy lại seed: `php artisan migrate:fresh --seed`
2. Tạo nhanh kịch bản thanh lý bị thiếu tiền (Kịch bản B -> `PENDING_SETTLEMENT`).

### Manual Verification
1. **Frontend:** Mở giao diện Termination Wizard, đi đến Bước 3 và kiểm tra xem cảnh báo/công thức tính cọc có hiển thị rõ ràng, dễ hiểu không.
2. **Backend (Listener):**
    *   Vào Hợp đồng đang ở trạng thái `PENDING_SETTLEMENT`.
    *   Truy cập Hóa đơn đang nợ của hợp đồng đó và thao tác "Duyệt thanh toán" (Đánh dấu đã thanh toán toàn bộ).
    *   Kiểm tra trạng thái hợp đồng xem có tự động chuyển sang `TERMINATED` hay không.
