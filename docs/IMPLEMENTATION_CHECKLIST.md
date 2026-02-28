# IMPLEMENTATION CHECKLIST — Hostech Backend

> Cập nhật lần cuối: 2026-02-28

---

## ✅ Đã hoàn thành

### Auth & Profile Module
- [x] Đăng ký / Đăng nhập qua Fortify
- [x] Logout + token revoke (Sanctum)
- [x] `GET /api/auth/me` → UserResource (không lộ sensitive fields)
- [x] `GET /api/profile` — đầy đủ profile
- [x] `PUT /api/profile` — cập nhật thông tin cá nhân (incl. identity fields)
- [x] `POST /api/profile/change-password` — đổi mật khẩu (verify old password)
- [x] `POST /api/profile/avatar` — upload avatar qua Spatie Media Library
- [x] `GET /api/profile/mfa-status` — trạng thái 2FA/OTP
- [x] Fortify 2FA (TOTP) endpoints sẵn sàng
- [x] User model: identity_number, date_of_birth, address trong $fillable
- [x] media table: uuidMorphs (fix từ morphs)
- [x] ProfileTest: 9 tests, 47 assertions ✅

### Org & User Module
- [x] CRUD Org (với soft delete, restore, force delete)
- [x] CRUD User (với soft delete, restore, force delete)
- [x] OrgPolicy + UserPolicy (RBAC)
- [x] Org sub-routes: /properties, /users, /services

### User Invitation Module
- [x] Tạo invitation với phân quyền theo role
- [x] Validate token trước đăng ký (public endpoint)
- [x] Đăng ký với invitation_token → auto gán role + org_id
- [x] Phân quyền invite: Admin→Owner, Owner→Manager/Staff/Tenant, Manager→Staff/Tenant
- [x] Test: UserInvitationTest ✅

### Property Module
- [x] CRUD Property, Floor, Room (với soft delete)
- [x] RoomAsset CRUD (nested route)
- [x] PropertyPolicy, RoomPolicy (RBAC + Tenant scoping)
- [x] PropertyService, RoomService (paginate + Tenant scope)
- [x] Tenant chỉ thấy property/room đang có contract ACTIVE+APPROVED
- [x] Room.contracts() relationship
- [x] Property.contracts() relationship

### Service Module
- [x] CRUD Service (dịch vụ)
- [x] CRUD Room Service (dịch vụ theo phòng)
- [x] ServicePolicy, RoomServicePolicy

### Contract Module
- [x] CRUD Contract (với soft delete)
- [x] CRUD ContractMember
- [x] Tenant Signature Flow:
  - [x] `GET /contracts/my-pending`
  - [x] `POST /contracts/{id}/accept-signature`
  - [x] `POST /contracts/{id}/reject-signature`
- [x] Tenant Self-Service:
  - [x] `POST /contracts/{id}/members` — mời roommate
  - [x] `GET /contracts/{id}/available-rooms` — phòng trống cùng tòa nhà
  - [x] `POST /contracts/{id}/room-transfer-request` — xin đổi phòng
- [x] ContractPolicy: addMember, view, CRUD
- [x] Dormant Tenant Logic: không thể xem rooms/properties khi chưa ký contract
- [x] DormantTenantAccessTest: 5 tests, 17 assertions ✅
- [x] TenantSelfServiceTest: 6 tests, 17 assertions ✅

### Meter Module
- [x] CRUD Meter
- [x] CRUD MeterReading
- [x] Adjustment Note + Approve/Reject flow
- [x] MeterService Tenant scoping
- [x] Meter.readings relationship

### Invoice Module
- [x] CRUD Invoice (với soft delete)
- [x] Invoice Items (storeItem, destroyItem)
- [x] Hierarchical view: /properties/{id}/invoices, /properties/{id}/floors/{fid}/invoices
- [x] InvoiceService Tenant scoping
- [x] invoice_status_histories model + migration
- [x] invoice_adjustments model + migration

### System Module
- [x] Media upload (POST /api/media/upload)
- [x] Audit Log (GET /api/audit-logs)
- [x] Audit Log detail (GET /api/audit-logs/{id})

---

## 🔶 Đang triển khai / Cần hoàn thiện

### Contract Module
- [ ] Phê duyệt room transfer request (Manager side) — hiện lưu tạm vào meta
- [ ] Notification email khi Tenant được thêm vào contract (PENDING)
- [ ] Contract termination flow (chấm dứt hợp đồng sớm)

### Invoice Module
- [ ] Invoice Status transition API (DRAFT→SENT, SENT→PAID, ...)
- [ ] invoice_adjustments: approve/reject flow (API endpoint chưa có)
- [ ] Invoice payment tracking

### Meter Module
- [ ] Tự động tạo Invoice từ MeterReading (batch tạo hóa đơn cuối kỳ)

---

## ❌ Chưa thực hiện

### Handover Module (Bàn giao)
- Kế hoạch có tại: `docs/project_specs/HandoverModule.md`
- [ ] HandoverRecord CRUD
- [ ] HandoverItem CRUD
- [ ] HandoverMedia CRUD
- [ ] Handover approval flow
- [ ] Handover Tenant scoping

### Ticket Module (Phiếu yêu cầu)
- Kế hoạch có tại: `docs/project_specs/TICKET_MODULE_PLAN.md`
- [ ] Ticket CRUD
- [ ] TicketComment CRUD
- [ ] Ticket type: MAINTENANCE / COMPLAINT / ROOM_CHANGE / OTHER
- [ ] Ticket status flow: OPEN → IN_PROGRESS → RESOLVED → CLOSED
- [ ] Tenant scope: chỉ xem ticket của mình

### Dashboard / Reports
- [ ] Dashboard tổng quan (số phòng, hóa đơn, hợp đồng, ...)
- [ ] Báo cáo doanh thu
- [ ] Báo cáo công suất phòng

### Notification System
- [ ] Email notification khi invite
- [ ] Email notification khi thêm vào contract
- [ ] Push notification (optional)

---

## 📝 Cần cải thiện

- [ ] Rate limiting cho auth endpoints
- [ ] API documentation cập nhật qua Scramble
- [ ] Seeder cập nhật cho dữ liệu mẫu đầy đủ hơn
- [ ] Docker setup cho môi trường dev
