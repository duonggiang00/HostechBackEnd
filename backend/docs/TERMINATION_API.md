# Luồng thanh lý hợp đồng — API (EDA)

Tài liệu ngắn cho tích hợp / wizard: thứ tự gợi ý và tham số đồng bộ.

## Thứ tự gợi ý (sync)

1. `GET .../contracts/{id}/termination-handover` / `POST .../termination-handover` — biên bản bàn giao (độc lập pipeline).
2. Tạo HĐ qua billing (`POST /invoices`, `PUT /invoices/{id}/issue`) rồi `POST .../contracts/{id}/terminate/link-final-invoice` — gắn HĐ ISSUED làm bản thanh lý cuối (cùng payload sync: `termination_date`, `billing_mode`, …). Hoặc luồng legacy: `POST .../terminate/issue-final-invoice`.
3. `POST .../contracts/{id}/terminate/finalize` — body: `refund_receipt_lines` (optional, dòng hoàn do manager nhập), `forfeit_remaining_deposit` (optional). Backend cấn trừ cọc FIFO lên hóa đơn, **validate** tổng dòng hoàn ≤ cọc còn lại sau cấn trừ, rồi tạo `RefundReceipt` / `FinalPaymentRequest` / thu hồi (FORFEIT) tùy kết quả.

Tuỳ chọn: `GET .../termination/liquidation-preview` — ước tính pipeline (không ghi DB). Trường `hoan_tra_goodwill_du_kien` luôn 0; mọi hoàn thỏa thuận nhập qua `refund_receipt_lines` khi finalize.

## Async

- `POST .../contracts/{id}/terminate` — trả `202`, queue job. Payload hỗ trợ `billing_mode`, `mid_month_rent_credit` giống bước phát hành HĐ (không còn field `refund_remaining_rent` — đã gỡ khỏi validation).

## Khái niệm

- **`billing_mode`**: `combined` | `split` — giống `issue-final-invoice`.
- **`mid_month_rent_credit`**: số tiền giảm trên HĐ thanh lý khi đã có HĐ định kỳ cả tháng hoặc `split` (dòng DISCOUNT âm).
- **`refund_receipt_lines`**: danh sách `{ description, amount }` — tổng không vượt phần cọc còn lại sau khi đã cấn trừ FIFO lên các hóa đơn (kể cả HĐ thanh lý). Ghi trong `RefundReceipt.meta` (`refund_receipt_lines`, `deposit_refund_portion` bằng tổng hoàn).

## Early termination (phạt)

Điều kiện phạt so sánh **`termination_date`** với **ngày hết hạn đã lên lịch** (`end_date` trước khi thanh lý). Sau pipeline, ngày đó lưu trong `meta.termination_details.scheduled_end_date`.

## Tài liệu bổ sung

- Kịch bản quyết toán (A / B / C), FIFO, trạng thái hóa đơn và yêu cầu thanh toán cuối: [TERMINATION_SETTLEMENT_SCENARIOS.md](./TERMINATION_SETTLEMENT_SCENARIOS.md).
- Spike thiết kế (nhiều hóa đơn với một yêu cầu thanh toán cuối): [SPIKE_FPR_MULTI_INVOICE.md](./SPIKE_FPR_MULTI_INVOICE.md).
