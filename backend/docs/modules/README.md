# Hostech Backend — Module Documentation Index

> Mỗi file tương ứng 1 module chức năng trong hệ thống quản lý nhà trọ.

---

| File | Module | Trạng thái |
|------|--------|-----------|
| [01_auth_profile.md](01_auth_profile.md) | Xác thực & Hồ sơ | ✅ Hoàn thành |
| [02_org_user.md](02_org_user.md) | Tổ chức & Người dùng | ✅ Hoàn thành |
| [03_property_floor_room.md](03_property_floor_room.md) | Bất động sản & Phòng | ✅ Hoàn thành |
| [04_contract.md](04_contract.md) | Hợp đồng | ✅ Hoàn thành |
| [05_service.md](05_service.md) | Dịch vụ | ✅ Hoàn thành |
| [06_meter.md](06_meter.md) | Đồng hồ & Chỉ số | ✅ Hoàn thành |
| [07_invoice.md](07_invoice.md) | Hóa đơn | ✅ Hoàn thành |
| [08_system.md](08_system.md) | Hệ thống (Media, Log, Invite) | ✅ Hoàn thành |
| 09_handover.md *(planned)* | Bàn giao phòng | ❌ Chưa triển khai |
| 10_ticket.md *(planned)* | Phiếu yêu cầu | ❌ Chưa triển khai |

---

## Kiến trúc luồng dữ liệu

```
Org (Tổ chức)
├── User (Người dùng — Owner, Manager, Staff, Tenant)
├── Service (Dịch vụ)
└── Property (Tòa nhà)
    ├── Floor (Tầng)
    └── Room (Phòng)
        ├── RoomAsset (Đồ dùng)
        ├── RoomService (Dịch vụ theo phòng)
        ├── Meter (Đồng hồ)
        │   └── MeterReading (Chỉ số kỳ)
        │       └── AdjustmentNote (Điều chỉnh)
        ├── Contract (Hợp đồng)
        │   └── ContractMember (Thành viên)
        └── Invoice (Hóa đơn)
            └── InvoiceItem (Khoản mục)
```

## Luồng Tenant (Quy trình thuê phòng)

```
1. Owner/Manager tạo invite → Tenant nhận email
2. Tenant đăng ký với invite_token → Có tài khoản (DORMANT)
3. Manager tạo Contract → Gắn Tenant vào ContractMember (PENDING)
4. Tenant GET /contracts/my-pending → Thấy hợp đồng
5. Tenant POST /contracts/{id}/accept-signature → APPROVED + ACTIVE
6. Tenant có thể xem Room, Property, Invoice, Meter của mình
```
