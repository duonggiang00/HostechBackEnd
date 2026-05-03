# Spike thiết kế: yêu cầu thanh toán cuối gắn nhiều hóa đơn hoặc nhiều đợt phân bổ

**Mục đích:** Ghi lại các hướng kỹ thuật nếu nghiệp vụ hoặc kế toán **bắt buộc** tách **hóa đơn** (ví dụ chứng từ riêng cho phạt hợp đồng so với tiền thuê) trong khi vẫn cần luồng “thu bổ sung sau thanh lý”.

**Trạng thái hiện tại (baseline):** Một bản ghi **yêu cầu thanh toán cuối** (`FinalPaymentRequest`) gắn **một** `invoice_id` (thường là **hóa đơn thanh lý cuối**). Thanh toán tạo `Payment` với một hoặc nhiều dòng phân bổ (`PaymentAllocation`), nhưng luồng ghi nhận từ controller yêu cầu thanh toán cuối hiện phân bổ **toàn bộ số tiền** vào **một hóa đơn** đó.

**Đã triển khai (tùy tổ chức):** Khi `orgs.settings.termination_require_supplemental_invoice_for_outstanding` bật và kịch B sau cấn trừ, hệ thống tạo **một hóa đơn phát hành bổ sung** + **CREDIT** trên **hóa đơn thanh lý**, rồi **một** `FinalPaymentRequest` với `invoice_id` trỏ vào **hóa đơn bổ sung** (vẫn một FPR — một hóa đơn thu; gần với Phương án C nhưng tự động trong `TerminationReconciliationService::reconcile`). Hợp đồng chuyển **TERMINATED** ngay (phòng trống); thu nợ còn theo FPR / hóa đơn, không giữ `PENDING_SETTLEMENT`.

---

## Phương án A — Giữ một yêu cầu thanh toán cuối, mở rộng phân bổ nhiều hóa đơn

**Ý tưởng:** `FinalPaymentRequest` vẫn một bản ghi; API ghi nhận thu nhận `allocations[]` (danh sách `{ invoice_id, amount }`) với tổng bằng số thu, trong đó có thể gồm **hóa đơn thanh lý** và **hóa đơn** định kỳ còn nợ.

**Ưu điểm:** Một luồng “đóng quyết toán **hợp đồng**” rõ; một mốc tham chiếu nghiệp vụ.

**Nhược điểm:** Cần sửa validation, quyền, và đảm bảo mọi **hóa đơn** trong phân bổ thuộc cùng **hợp đồng** / tổ chức; listener kiểm tra hết nợ phải xét **tất cả** **hóa đơn** liên quan tới **hợp đồng** chứ không chỉ **hóa đơn thanh lý**.

**Rủi ro:** Lệch với giả định UI hiện chỉ hiển thị một **hóa đơn** quyết toán trên wizard.

---

## Phương án B — Nhiều yêu cầu thanh toán cuối tuần tự (một yêu cầu cho mỗi hóa đơn)

**Ý tưởng:** Sau quyết toán, sinh N bản ghi yêu cầu thanh toán cuối, mỗi bản `invoice_id` khác nhau, trạng thái **hợp đồng** chỉ về **đã chấm dứt** khi **tất cả** yêu cầu ở trạng thái đã thỏa.

**Ưu điểm:** Tách bạch chứng từ theo **hóa đơn**; tái sử dụng gần như nguyên mẫu một yêu cầu — một **hóa đơn**.

**Nhược điểm:** Cần quy tắc tạo N (thứ tự ưu tiên nợ, làm tròn từng **hóa đơn**); UI phải liệt kê / hành động trên nhiều yêu cầu; tránh trùng thu nếu người dùng ghi nhận hai lần.

---

## Phương án C — Không đổi yêu cầu thanh toán cuối; dùng hóa đơn bổ sung / điều chỉnh trong module billing

**Ý tưởng:** Vẫn **một hóa đơn thanh lý** + **một yêu cầu thanh toán cuối**; nếu cần tách chứng từ, tạo **hóa đơn** phụ hoặc điều chỉnh qua quy trình billing hiện có, rồi **cấn cọc** hoặc **thu** theo quy trình thường (ngoài hoặc trước bước yêu cầu thanh toán cuối).

**Ưu điểm:** Ít đụng lõi thanh lý; phù hợp khi tách chứng từ là ngoại lệ.

**Nhược điểm:** Phải phối hợp thủ công giữa “đã có **hóa đơn** phụ chưa” và “đã finalize **hợp đồng** chưa” để tránh số âm / trùng.

---

## Khuyến nghị spike

1. **Ưu tiên nghiệp vụ:** Xác nhận có bắt buộc **tách hóa đơn** trên chứng từ thuế / kế toán hay chỉ cần **dòng chi tiết** trên **một hóa đơn thanh lý**.
2. Nếu bắt buộc tách: chọn **Phương án B** nếu mỗi **hóa đơn** có một vòng thu độc lập; chọn **Phương án A** nếu muốn **một lần thu** gạch nhiều **hóa đơn**.
3. Trước khi code: bảng ma trận kiểm thử (FIFO + N **hóa đơn** + trạng thái **hợp đồng** + listener) và wireframe wizard / màn tài chính.

Không triển khai mã trong spike này — chỉ định hướng để ước lượng công sức và rủi ro.
