# Kế Hoạch Tích Hợp: Lịch Sử & Điều Chỉnh Hóa Đơn (Invoice History & Adjustment)

Tài liệu này vạch ra chiến lược tích hợp 2 model mới: `InvoiceStatusHistory` và `InvoiceAdjustment` vào Module Hóa Đơn (Invoice) hiện tại. Mục tiêu là theo dõi minh bạch mọi thay đổi vòng đời của Hóa đơn và quản lý công nợ phụ phát sinh (Credit/Debit) mà không cần phải xóa/sửa hóa đơn gốc.

## 1. Tóm tắt Cấu trúc Dữ liệu Mới & Mục tiêu

*   **`invoice_status_histories`**: Tự động ghi nhận log khi hóa đơn chuyển đổi trạng thái (VD: DRAFT -> ISSUED -> PAID). Lưu vết người thực hiện (`changed_by_user_id`), thời gian (`created_at`) và lý do/ghi chú (`note`).
*   **`invoice_adjustments`**: Lưu các khoản điều chỉnh giá trị hóa đơn (Tăng/Giảm) đối với các Hóa đơn đã xuất (ISSUED) hoặc chờ thanh toán (PENDING).
    *   **CREDIT (Giảm trừ)**: Giảm số tiền khách phải trả (VD: Bồi thường sự cố nước yếu, giảm giá sự kiện).
    *   **DEBIT (Thu thêm)**: Tăng số tiền khách phải trả (VD: Phạt trả chậm, phí sửa chữa chốt sau).
    *   **Workflow**: Create -> Approve. Chỉ những Adjustment đã `approved_at` mới được tính vào Tổng tiền.

---

## 2. Tích hợp `InvoiceStatusHistory`

### A. Tích hợp vào `InvoiceService`
Bất cứ khi nào cập nhật cột `status` trên bảng `invoices`, hệ thống PHẢI gọi một hàm Hook tự động tạo bản ghi lịch sử.
*   **Hành động**: Trong `App\Services\Invoice\InvoiceService`.
*   **Triển khai**: Tạo một private function `recordStatusHistory($invoice, $oldStatus, $newStatus, $note = null)`.
*   **Các Service Method bị ảnh hưởng**:
    *   `issueInvoice()`: `DRAFT` -> `ISSUED`/`PENDING`.
    *   `payInvoice()`: `PENDING` -> `PAID`.
    *   `cancelInvoice()`: Bất kỳ trạng thái nào -> `CANCELLED`.
    *   `updateStatus()`: Endpoint nếu cho phép Owner đổi status thủ công (DRAFT -> PENDING).

### B. Tích hợp API (Read)
*   **Endpoint**: `GET /api/invoices/{invoice}/histories`
*   **Trả về**: Một JSON array chứa danh sách lịch sử thay đổi trạng thái theo thời gian thực.
*   **Resource**: Bổ sung eager loading `$invoice->load('statusHistories.changedBy')` khi view chi tiết 1 Hóa đơn `GET /api/invoices/{invoice}`.

---

## 3. Tích hợp `InvoiceAdjustment`

### A. Tính toán Lại Tổng tiền (Tổng nợ cần thanh toán)
Đây là thay đổi lõi của Module tài chính. Khi có Adjustment, số tiền Cuối cùng (Final Amount) của hóa đơn sẽ khác với Tổng tiền các món đồ (Invoice_Items).
*   **Công thức**: `Final Amount = SUM(invoice_items.amount) + SUM(approved_adjustments DEBIT) - SUM(approved_adjustments CREDIT)`.
*   **Cập nhật trên Invoice Model**:
    *   Nơi áp dụng: Khi view hóa đơn (`InvoiceResource`).
    *   Lưu ý: Có 2 lựa chọn. Một là tính toán Dynamic khi fetch (`attribute` ảo), Hai là mỗi khi có Adjustment được duyệt (Approved), hệ thống sẽ chủ động cập nhật lại cột `total_amount` trên bảng `invoices`. **Lựa chọn 2 an toàn và tối ưu performance hơn**.

### B. Các Service Method Cần Xây Dựng
Tạo mới file: `App\Services\Invoice\InvoiceAdjustmentService` để xử lý.
1.  **`createAdjustment(Invoice $invoice, array $data, User $user)`**:
    *   Tenant không được gọi. Chỉ Owner/Manager.
    *   Validate xem hóa đơn có hợp lệ để Adjustment không (Ví dụ nếu đã PAID hoặc CANCELLED thì từ chối).
    *   Tạo bản ghi Adjustment mới (Trạng thái mặc định: Not Approved).
2.  **`approveAdjustment(InvoiceAdjustment $adjustment, User $approver)`**:
    *   Set `approved_by_user_id` và `approved_at = now()`.
    *   **Hook Quan trọng**: Gọi ngược lại `$invoice->update(['total_amount' => TÍNH TOÁN LẠI TỪ TOÀN BỘ ITEMS & ADJUSTMENTS])`.
3.  **`deleteAdjustment(InvoiceAdjustment $adjustment)`**: Xóa adjustment nếu chưa duyệt. Hoặc nếu đã duyệt thì cấm xóa (Chỉ được phép tạo adjustment đảo ngược để cân đối sổ cái - theo nghiệp vụ kế toán sâu). Thiết kế hiện tại: Nếu chưa duyệt thì cho xóa.

### C. Tích hợp API (Controller/Routes)
Yêu cầu thiết lập Nested Route theo Hóa đơn:
*   `POST /api/invoices/{invoice}/adjustments` (Tạo khoản điều chỉnh).
*   `GET /api/invoices/{invoice}/adjustments` (Liệt kê).
*   `PUT /api/invoices/{invoice}/adjustments/{adjustment}/approve` (Duyệt/Áp dụng khoản điều chỉnh đó vào hóa đơn).
*   `DELETE /api/invoices/{invoice}/adjustments/{adjustment}`.

---

## 4. Quyền hạn Bảo mật (Policies)
Toàn bộ cụm tính năng Điều chỉnh (Adjustments) và Lịch sử phải được khóa kín bởi RBAC:
*   **Staff**: Chỉ được (GET) đọc danh sách lịch sử và các khoản điều chỉnh (nếu được nhượng quyền đọc Invoice).
*   **Manager/Owner**: Được phép (POST) tạo Điều chỉnh và (PUT) Duyệt (Approve) Điều chỉnh trực tiếp. Đảm bảo Scope `checkOrgScope` giống như mọi module khác.
*   **Tenant (Khách thuê)**: Chỉ có thể xem danh sách Adjustments trên các hóa đơn áp cho Hợp đồng của họ. (Credit/Debit sẽ được in trên phiếu thu và portal của họ để minh bạch).

## 5. Lộ trình Thực thi Code
1.  **Chỉnh sửa InvoiceService**: Đục lỗ (Hook) để chèn dòng lệnh Insert vào `invoice_status_histories` khi trạng thái HĐ biến động. Viết Unit Test để xác nhận lưu lịch sử thành công.
2.  **Tạo API Resource cho History**: Xong bước 1.
3.  **Tạo InvoiceAdjustmentService**: Xây dựng Core function tính Final Amount.
4.  **Tạo Controller & Routes cho Adjustment**: Triển khai các Endpoint Create & Approve.
5.  **Cập nhật RolePolicy**: Thêm các Auth policies.
6.  **Tích hợp InvoiceResource**: Cập nhật Response lúc GET 1 Invoice -> trả về cả JSON array các Adjustments đã được duyêt đi kèm (Làm bằng chứng trừ/tiền phạt cho màn hình Font-end).
