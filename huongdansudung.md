# Workflow Vận Hành Dự Án Hostech (Bản Chuẩn Hóa)

Mục tiêu: luồng nghiệp vụ thông suốt từ lúc tạo tài sản -> ký hợp đồng -> thu tiền -> vận hành tháng -> chuyển phòng/thanh lý.

## 1) Thiết lập dữ liệu nền (chỉ làm 1 lần cho mỗi tòa nhà)
1. Tạo `Tòa nhà`.
2. Tạo `Dịch vụ`.
3. Tạo `Tầng`.
4. Tạo `Room template` và gắn dịch vụ vào template.
5. Tạo `Room` từ template (đồng hồ được tạo sẵn theo cấu hình).

## 2) Onboarding khách thuê và ký hợp đồng

### 2.1 Trường hợp khách chưa có tài khoản
1. Manager tạo hợp đồng ở trạng thái `DRAFT`.
2. Điền thông tin hợp đồng + scan hợp đồng giấy (nếu có).
3. Tạo lời mời tài khoản qua email.
4. Khách mở link mời, tạo tài khoản.
5. Khách vào màn hình hợp đồng và bấm ký xác nhận.
6. Hệ thống tự chuyển hợp đồng sang `PENDING_PAYMENT` và tạo hóa đơn đầu kỳ (tiền phòng + tiền cọc).
7. Manager xác nhận thanh toán theo 1 trong 2 nhánh:
   - Online: khách thanh toán VNPay, IPN cập nhật trạng thái thanh toán tự động.
   - Offline: nhân viên ghi nhận thanh toán thủ công.
8. Sau khi hóa đơn đầu kỳ đã thanh toán: Manager xác nhận kích hoạt hợp đồng -> hợp đồng `ACTIVE`, phòng `OCCUPIED`.

### 2.2 Trường hợp khách đã có tài khoản
1. Tìm user có sẵn.
2. Tạo hợp đồng + điền thông tin + scan file.
3. Khách vào website ký hợp đồng.
4. Luồng còn lại giống 2.1 từ bước 6 đến bước 8.

## 3) Vận hành hàng tháng (điện/nước + phát hành hóa đơn)
1. Staff nhập/chốt số điện nước -> bản ghi ở trạng thái chờ.
2. Manager duyệt bản ghi chốt số.
3. Hệ thống tính tiêu thụ và đồng bộ số liệu.
4. Phát hành hóa đơn tháng cho khách thuê.
5. Thanh toán:
   - Online: qua VNPay, callback tự cập nhật thanh toán.
   - Offline: thu tiền mặt/chuyển khoản và xác nhận thủ công.

## 4) Luồng chuyển phòng
1. Khách tạo yêu cầu chuyển phòng trong cùng tòa nhà.
2. Manager duyệt yêu cầu.
3. Chốt điện nước phòng cũ.
4. Cập nhật hợp đồng/phòng mới theo quyết định duyệt.
5. Phát hành hóa đơn chênh lệch nếu có.

## 5) Luồng thanh lý hợp đồng
1. Manager tạo yêu cầu thanh lý.
2. Chốt công nợ cuối (tiền phòng, dịch vụ, điện nước, cọc).
3. Hoàn cọc/khấu trừ theo chính sách.
4. Chuyển hợp đồng sang `TERMINATED` hoặc `ENDED` theo nghiệp vụ.
5. Trả phòng về `AVAILABLE`.

## 6) Trạng thái chuẩn cần thống nhất
- Contract: `DRAFT` -> `PENDING_SIGNATURE` -> `PENDING_PAYMENT` -> `ACTIVE` -> (`ENDED` | `TERMINATED` | `CANCELLED`)
- Invoice: `DRAFT` -> `ISSUED` -> (`PAID` | `CANCELLED`)
- Payment: `PENDING` (VNPay chờ callback) -> `APPROVED` hoặc `REJECTED`
- Meter reading: `PENDING` -> (`APPROVED` | `REJECTED`)

## 7) Quy tắc vận hành để tránh rời rạc
1. Không cho Manager kích hoạt hợp đồng nếu hóa đơn đầu kỳ chưa thanh toán.
2. Chỉ dùng một luồng chính cho thanh toán: `Payment` là nguồn sự thật, không cập nhật trạng thái invoice thủ công ngoài luồng này.
3. UI/FE phải dùng đúng endpoint backend hiện hành (tránh endpoint cũ).
4. Mọi trạng thái hiển thị ở frontend phải bao gồm `TERMINATED` để không mất dữ liệu nghiệp vụ.
5. Ưu tiên route phẳng có filter (không mở rộng route lồng sâu thêm).

## 8) Checklist thao tác nhanh cho đội vận hành
- [ ] Tạo đủ dữ liệu nền: Tòa nhà/Tầng/Phòng/Dịch vụ/Template
- [ ] Hợp đồng có thành viên thuê chính
- [ ] Khách đã ký hợp đồng
- [ ] Hóa đơn đầu kỳ đã phát hành
- [ ] Thanh toán đầu kỳ đã xác nhận
- [ ] Hợp đồng đã `ACTIVE` và phòng đã `OCCUPIED`
- [ ] Chu kỳ tháng: chốt số -> duyệt -> phát hành hóa đơn -> thu tiền

## 9) API chính cần dùng đúng
- Ký hợp đồng: `POST /api/contracts/{id}/accept-signature`
- Từ chối ký: `POST /api/contracts/{id}/reject-signature`
- Danh sách hợp đồng chờ ký của tenant: `GET /api/contracts/my-pending`
- Yêu cầu chuyển phòng: `POST /api/contracts/{id}/room-transfer-request`
- Xác nhận kích hoạt hợp đồng sau thanh toán: `POST /api/contracts/{id}/confirm-payment`
- Tạo thanh toán VNPay: `POST /api/finance/vnpay/create`
- Webhook VNPay: `POST /api/finance/vnpay/ipn`
- Kiểm tra kết quả VNPay: `GET /api/finance/vnpay/verify?txn_ref={payment_id}`
