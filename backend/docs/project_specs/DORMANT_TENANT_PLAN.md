# Kế hoạch Thực thi Backend: Quản lý Tenant Chờ (Dormant/Pending Tenants)

Tài liệu này vạch ra kiến trúc Backend để xử lý các tài khoản Tenant mới đăng ký qua Invite nhưng chưa được gán hoặc chưa ký bất kỳ hợp đồng thuê nhà (Contract) nào.

## Mục tiêu
1. Đảm bảo **Data Isolation** tuyệt đối: Tenant chưa có hợp đồng không được xem bất kỳ thông tin nào của Tòa nhà/Phòng.
2. Xây dựng luồng **Pending Contract**: Cho phép Tenant xem trước Hợp đồng nháp và Hành động "Ký/Thỏa thuận".
3. Mở khóa toàn quyền (Tickets, Handover, Invoices...) tự động ngay khi Hợp đồng chuyển sang `ACTIVE`.

---

## 1. Middleware / Policy Phân Quyền (RBAC & Scoping)

**Hiện trạng:** Lớp `RbacModuleProvider.php` và Trait `HandlesOrgScope.php` đang lọc dứ liệu theo `org_id`. Tuy nhiên, với Role `Tenant`, chỉ lọc theo `org_id` là một thảm họa bảo mật (họ sẽ thấy mọi phòng trong Org).

**Giải pháp:** Cập nhật cơ chế Scoping của Eloquent cho Role Tenant, bắt buộc Global Scopes hoặc xử lý qua Repository/Service Layer:

### A. Tòa nhà & Phòng (Properties & Rooms)
Cập nhật `PropertyPolicy` và `RoomPolicy`:
- `viewAny()` và `view()` cho Tenant: Bắt buộc lấy danh sách `property_id` và `room_id` từ bảng `contracts` mà user đó có tên trong `contract_members` với status = `APPROVED` và hợp đồng `ACTIVE`.
- **API Response:** Khi gọi `GET /api/properties` hoặc `GET /api/rooms`, DB query sẽ trả về `[]` (Mảng rỗng) nếu Tenant chưa có hợp đồng nào.

### B. Liên kết Dữ liệu Vận hành (Tickets, Invoices, Meters, Handovers)
Cập nhật Policy của các mô-đun này:
- Tenant chỉ được xem Invoices, Meters, Handovers liên quan trực tiếp đến `contract_id` của họ.
- **Dormant Tenant:** Khi gọi `GET /api/invoices`, query Builder tự động join với `contracts` và do Tenant chưa có hợp đồng `ACTIVE`, kết quả tự động rỗng.

---

## 2. API Quản lý Trạng thái Hợp Đồng (Contract Flow)

Dormant Tenant cần một Endpoint đặc biệt để lấy danh sách Hợp đồng đang chờ họ xác nhận.

### A. Bổ sung `ContractStatus` và `ContractMemberStatus`
- Bảng `contracts`: `status` = `DRAFT` (Đang nháp), `PENDING_SIGNATURE` (Chờ Tenant Ký), `ACTIVE`.
- Bảng `contract_members`: `status` = `PENDING` (Chờ khách đồng ý), `APPROVED`.

### B. Endpoint cho Tenant
1. `GET /api/contracts/my-pending`
   - Lọc ra các `contracts` có chứa `user_id` của Tenant hiện tại trong `contract_members` với status `PENDING`.
   - Dữ liệu trả về (Masked): Chỉ trả về thông tin cơ bản: Tên tòa nhà, Mã phòng, Giá thuê, Tiền cọc (Không trả về mã số cửa, hay tài sản chi tiết).

2. `POST /api/contracts/{id}/accept-signature`
   - Action của Tenant: Cập nhật `contract_members.status` -> `APPROVED`.
   - Nếu đủ chữ ký -> Tự động chuyển `contracts.status` -> `ACTIVE`.
   - Hệ thống Fire Event: `TenantSignedContract`.

3. `POST /api/contracts/{id}/reject-signature`
   - Action của Tenant: Cập nhật `contract_members.status` -> `REJECTED`.
   - Lưu kèm lý do từ chối.

---

## 3. Kiến trúc Database Changes (Kiểm tra lại DBML)

Bảng `contracts` và `contract_members` trong DBML hiện tại **ĐÃ ĐÁP ỨNG ĐỦ** logic này:
- `contracts.status` đã có DRAFT, ACTIVE. (Có thể cân nhắc thêm `PENDING`).
- `contract_members.status` đã có PENDING, APPROVED, REJECTED.
- Liên kết: `contract_members.user_id` hoàn toàn khớp với Tenant System.

---

## 4. Các bước Code Thực tế (Implementation Steps)

1. **Cập nhật Scopes trong Services:** Sửa các file Service (`PropertyService`, `RoomService`, `InvoiceService`...) bổ sung đoạn code kiểm tra Role:
   ```php
   if (auth()->user()->hasRole('Tenant')) {
       $query->whereHas('contracts.members', function ($q) {
           $q->where('user_id', auth()->id())->where('status', 'APPROVED');
       })->where('contracts.status', 'ACTIVE');
   }
   ```
2. **Khai báo ContractController:** Bổ sung phương thức `myPendingContracts()` và `acceptSignature()`.
3. **Cập nhật Notification / Email:** Khi Manager gán một User mới vào hợp đồng với trạng thái `PENDING`, tự động gửi Email báo Tenant (hoặc In-App Notification) yêu cầu đăng nhập và đọc hợp đồng nháp.

---

## Cần Xác Nhận Từ User (Review Required)
> [!IMPORTANT]
> Quy trình Hợp đồng online này anh/chị có muốn tích hợp chữ ký điện tử (ví dụ bắt upload ảnh CMND + Chữ ký vẽ tay) ở bước `accept-signature` không? Hay chỉ đơn giản là ấn một nút "Đồng ý" (Click-wrap agreement) là đủ tính pháp lý chốt hợp đồng đối với mô hình của mình?
