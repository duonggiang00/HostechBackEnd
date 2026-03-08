# IMPLEMENTATION CHECKLIST — Hostech Frontend

Tài liệu phản ánh đúng tiến độ thực tế của code Frontend.

## 🚀 Đã hoàn thành (UI/Logic Ready)

### 1. Nền tảng & Bảo mật
- [] Cấu hình Axios Client & Interceptors (`shared/api`).
- [] Quản lý Token qua Zustand `AuthStore`.
- [] Route Protection & RBAC Hooks (`usePermission.ts`).
- [] **Auth & Profile:** Login, Profile update, Avatar upload logic.

### 2. Tổ chức & Thành viên
- [] **Org Management:** CRUD Org (trong `features/properties/pages/Orgs`).
- [] **User Management:** Quản lý Tenant, Manager, Staff (trong `features/users`).

### 3. Bất động sản (Properties, Floors, Rooms)
- [] **Properties:** CRUD Tòa nhà.
- [] **Floors:** CRUD Tầng.
- [] **Rooms:** CRUD Phòng & Chi tiết phòng.
- [] **Meters (UI):** Giao diện quản lý đồng hồ (trong `features/properties/pages/Meters`).

### 4. Vận hành Core
- [] **Services:** Danh mục dịch vụ và gán dịch vụ (`features/services`).
- [] **Contracts:** Quản lý Hợp đồng (Draft, Active, End) (`features/contracts`).
- [] **Invoices:** CRUD Hóa đơn (`features/invoices`).

---

## 🔶 Đang triển khai / Chỉ mới có API (Roadmap)

### API Layer Ready (Chưa có UI)
- [ ] **Invitations:** Logic mời thành viên (Cần Page/Form).
- [ ] **Meter Reading:** Logic ghi chỉ số (Cần Form nhập liệu).
- [ ] **Media:** API Integration (Cần Component `MediaUploader`).
- [ ] **Audit Log:** Logic xem nhật ký (Cần Page/Table).
- [ ] **Handover:** Logic bàn giao (Cần Checklist UI).

### Chưa có Backend & Frontend
- [ ] **Ticket (Sự cố):** Đã có Docs, chờ triển khai API & UI.
- [ ] **Dashboard & Báo cáo:** Thống kê doanh thu, tỷ lệ lấp đầy.
- [ ] **Notifications:** Realtime updates.
- [ ] **Asset Management:** CRUD Tài sản chi tiết trong phòng.
- [ ] **E-Signature:** Luồng ký điện tử thực tế cho Tenant.
