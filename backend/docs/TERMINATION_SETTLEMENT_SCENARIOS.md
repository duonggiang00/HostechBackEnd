# Quyết toán thanh lý: kịch bản, cấn trừ cọc, hóa đơn và trạng thái

Tài liệu nội bộ mô tả luồng dữ liệu hiện có trong mã nguồn, để đồng bộ giữa nghiệp vụ, hỗ trợ và phát triển. Viết đầy đủ **hợp đồng** và **hóa đơn** (không dùng viết tắt).

## 1. Vai trò tiền cọc khi quyết toán

- Tiền cọc trên **hợp đồng** được dùng như **hạn mức tín dụng** trong bước quyết toán: không xóa bừa bản ghi cọc; hệ thống **cấn trừ** vào các **hóa đơn** đang còn dư nợ theo thứ tự đã định nghĩa trong mã (xem mục 2).
- Mục tiêu: sau quyết toán, số liệu **hóa đơn** (đã thanh toán / còn nợ) và trạng thái **hợp đồng** khớp với thực tế thu — tiền.

## 2. Cấn trừ FIFO (hóa đơn cũ trước, hóa đơn thanh lý sau)

File tham chiếu: `app/Services/Contract/Termination/TerminationReconciliationService.php`, phương thức `reconcile`.

1. Lấy danh sách **hóa đơn cũ** (không phải hóa đơn thanh lý) còn dư nợ, sắp xếp theo kỳ / hạn thanh toán / thời điểm tạo.
2. Lần lượt **áp tiền cọc** vào từng **hóa đơn cũ** cho đến khi hết cọc hoặc hết nợ trên các hóa đơn đó.
3. Nếu còn cọc, **áp phần còn lại** vào **hóa đơn thanh lý cuối** (hóa đơn có cờ thanh lý, gắn **hợp đồng** và ngày thanh lý).
4. Đọc lại **dư nợ** trên **hóa đơn thanh lý cuối** sau bước cấn trừ.

## 3. Kịch bản A, B, C (ước lượng trước cấn trừ chi tiết)

Cùng service có bước **xem trước** (preview) tính `balance` tương đương:

`tiền cọc − tổng nợ các hóa đơn cũ (theo danh sách FIFO) − tổng tiền trên hóa đơn thanh lý (dòng khoản)`

- **Kịch bản A** (`balance` dương rõ): sau quyết toán có phần **hoàn** cho bên thuê (biên lai hoàn / phân bổ theo cấu hình).
- **Kịch bản B** (`balance` âm rõ): **tổng nợ và phí thanh lý** lớn hơn **tiền cọc** — kỳ vọng nghiệp vụ là còn phải **thu thêm** sau khi cọc đã được dùng hết phần có thể.
- **Kịch bản C** (`balance` gần không): không phát sinh hoàn hoặc thu thêm đáng kể sau làm tròn.

Sau khi **chạy cấn trừ thực tế** trong `reconcile`, kịch bản thực tế trả về cho client có thể là **A** hoặc **B** hoặc **C** tùy **dư nợ còn lại trên hóa đơn thanh lý** và logic hoàn (ví dụ tạo **yêu cầu thanh toán cuối** khi dư nợ trên hóa đơn thanh lý vẫn lớn hơn ngưỡng làm tròn).

## 4. Yêu cầu thanh toán cuối (kịch bản B sau cấn trừ)

Khi **dư nợ trên hóa đơn thanh lý cuối** vẫn lớn hơn ngưỡng làm tròn (trong mã thường là `0.02`):

- **Mặc định (cờ tổ chức tắt):** hệ thống tạo **yêu cầu thanh toán cuối** (`FinalPaymentRequest`) với `invoice_id` trỏ tới **hóa đơn thanh lý** đó, `amount_due` bằng dư nợ.
- **Tùy chọn theo tổ chức:** nếu trong `orgs.settings` bật `termination_require_supplemental_invoice_for_outstanding` (boolean), hệ thống **phát hành thêm một hóa đơn thường** (không phải hóa đơn thanh lý) với tổng bằng dư nợ, ghi **điều chỉnh CREDIT đã duyệt** trên **hóa đơn thanh lý** cùng số tiền (để tổng nợ hợp đồng không bị cộng đôi — listener `CheckAndResolvePendingSettlement` cộng nợ trên mọi hóa đơn còn dư), đồng bộ `paid_amount` / trạng thái hóa đơn thanh lý sau khi tính lại tổng, rồi tạo **yêu cầu thanh toán cuối** với `invoice_id` trỏ vào **hóa đơn bổ sung**. `FinalPaymentRequest.meta` ghi `termination_invoice_id` và `supplemental_invoice_id` để truy vết.
- **Hợp đồng** ngay trong bước quyết toán chuyển sang **đã thanh lý** (`TERMINATED`), ghi nhận phòng trống (`room.status = available`) dù vẫn còn nợ phải thu qua FPR — nợ thu hồi theo dõi trên hóa đơn / FPR, không chặn trạng thái hợp đồng. Khi các hóa đơn liên quan đã thanh toán đủ, listener `CheckAndResolvePendingSettlement` **đóng** các FPR còn `PENDING` và ghi `post_termination_outstanding_cleared_at` vào `meta` hợp đồng. Hợp đồng ở trạng thái cũ `PENDING_SETTLEMENT` (dữ liệu lịch sử) vẫn được xử lý tương thích khi thu đủ.

Cập nhật cờ: `PATCH /api/orgs/{id}` với body JSON gồm `settings` (object); khóa `termination_require_supplemental_invoice_for_outstanding` được merge vào `settings` hiện có. `GET` org (resource) trả về `settings` để kiểm tra.

Ghi nhận thu (tiền mặt / chuyển khoản; chuyển khoản kèm ảnh bằng chứng) tạo **thanh toán** và phân bổ vào **hóa đơn** được gắn trong yêu cầu thanh toán cuối. Khi **hóa đơn** được thanh toán đủ, luồng sự kiện có thể chuyển **hợp đồng** sang **đã chấm dứt** nếu không còn nợ treo theo quy tắc listener (ví dụ `CheckAndResolvePendingSettlement`).

## 5. Hai tập “trạng thái hóa đơn” cần phân biệt

### 5.1. Hóa đơn đưa vào vòng FIFO cấn cọc (hóa đơn cũ)

Trong `fifoOutstandingInvoices`, chỉ lấy **hóa đơn không phải thanh lý** có `status` thuộc:

`ISSUED`, `LATE`, `PARTIAL`, `OVERDUE`

Các **hóa đơn** ở trạng thái khác (ví dụ nháp, đã thanh toán đủ) không vào danh sách cấn trừ theo FIFO này.

### 5.2. Hóa đơn được coi là “còn nợ có thể thu” trên dashboard / tổng hợp hợp đồng

Model `Invoice::outstandingDebtStatuses()` trả về:

`ISSUED`, `OVERDUE`, `PARTIAL`, `PENDING`, `LATE`

Tập này **rộng hơn** tập dùng cho FIFO (có thêm `PENDING`). Khi giải thích cho nghiệp vụ: **tổng nợ hiển thị** có thể gồm **hóa đơn** đang chờ xác minh, trong khi **cấn cọc lúc thanh lý** có thể **không** đụng tới các **hóa đơn** đó — cần đọc đúng ngữ cảnh màn hình và API.

### 5.3. Sau khi thu đủ

**Hóa đơn** chuyển sang trạng thái thanh toán đủ (trong luồng hiện tại thường là `PAID`). Đây là điều kiện để chuỗi xử lý “đóng” **hợp đồng** sau quyết toán tiếp tục.

## 6. Tiền hoàn bằng không khi nợ lớn hơn cọc

Đây là tình huống **bình thường** của **kịch bản B**: không có khoản hoàn cho bên thuê **không** có nghĩa là không còn phải thu — phần chênh đã phản ánh qua **dư nợ trên hóa đơn** (cũ và/hoặc **hóa đơn thanh lý**) và được xử lý tiếp bằng **yêu cầu thanh toán cuối** cùng ghi nhận thu.

## 7. Liên kết tài liệu API thao tác

- Thứ tự gọi API và tham số đồng bộ: [TERMINATION_API.md](./TERMINATION_API.md).
- Phân tích tách nhiều **hóa đơn** với một yêu cầu thanh toán cuối (spike; phần “một FPR trỏ hóa đơn phát hành bổ sung” đã triển khai khi bật cờ tổ chức): [SPIKE_FPR_MULTI_INVOICE.md](./SPIKE_FPR_MULTI_INVOICE.md).
