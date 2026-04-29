# Sơ đồ use case — luồng chức năng Hostech

Tài liệu dùng [Mermaid useCaseDiagram](https://mermaid.js.org/syntax/usecase.html) (không dùng `package` để tương thích renderer cũ). Xem trên GitHub, VS Code (Mermaid preview), hoặc docs site hỗ trợ Mermaid.

---

## 1. Tổng thể — tác nhân ↔ use case (phân mảnh)

### 1a. Khách & xác thực

```mermaid
useCaseDiagram
  actor Guest as Khach
  actor Tenant as Cu_dan
  actor BQL as BQL_Owner_Manager_Staff

  usecase UC_Login as Dang_nhap
  usecase UC_MFA as MFA
  usecase UC_Invite as Loi_moi_dang_ky
  usecase UC_Prof as Ho_so_RBAC

  Guest --> UC_Login
  Guest --> UC_Invite
  Tenant --> UC_Login
  Tenant --> UC_MFA
  Tenant --> UC_Prof
  BQL --> UC_Login
  BQL --> UC_MFA
  BQL --> UC_Prof
```



### 1b. BQL đầy đủ (Owner / Manager / Staff — mức độ quyền khác nhau theo RBAC)

```mermaid
useCaseDiagram
  actor Owner
  actor Manager
  actor Staff

  usecase UC_Org as Quan_ly_to_chuc
  usecase UC_User as Nguoi_dung
  usecase UC_Prop as Toa_phong
  usecase UC_HD as Hop_dong
  usecase UC_Inv as Hoa_don
  usecase UC_Pay as Thanh_toan_so_cai
  usecase UC_Met as Dong_ho
  usecase UC_Op as Ticket_ban_giao

  Owner --> UC_Org
  Owner --> UC_User
  Owner --> UC_Prop
  Owner --> UC_HD
  Owner --> UC_Inv
  Owner --> UC_Pay
  Owner --> UC_Met
  Owner --> UC_Op

  Manager --> UC_User
  Manager --> UC_Prop
  Manager --> UC_HD
  Manager --> UC_Inv
  Manager --> UC_Pay
  Manager --> UC_Met
  Manager --> UC_Op

  Staff --> UC_Prop
  Staff --> UC_HD
  Staff --> UC_Inv
  Staff --> UC_Pay
  Staff --> UC_Met
  Staff --> UC_Op
```



### 1c. Admin hệ thống

```mermaid
useCaseDiagram
  actor Admin

  usecase UC_All as Toan_bo_use_case_BQL
  Admin --> UC_All
```



*(Thực tế: `Gate::before` cho phép Admin vượt mọi policy; trên SPA Admin dùng chung shell `/org` và `/properties`.)*

### 1d. Cư dân (portal)

```mermaid
useCaseDiagram
  actor Tenant

  usecase UC_D as Bang_dieu_khien
  usecase UC_B as Hoa_don_thanh_toan
  usecase UC_P as Gui_bang_chung
  usecase UC_C as Hop_dong
  usecase UC_S as So_do_toa
  usecase UC_T as Phieu_yeu_cau

  Tenant --> UC_D
  Tenant --> UC_B
  Tenant --> UC_P
  Tenant --> UC_C
  Tenant --> UC_S
  Tenant --> UC_T
```



### 1e. Hệ thống ngoài

```mermaid
useCaseDiagram
  actor VNPay as VNPay
  usecase UC_IPN as IPN_xac_nhan_giao_dich
  VNPay --> UC_IPN
```



---

## 2. Xác thực, lời mời, hồ sơ

```mermaid
useCaseDiagram
  actor Guest
  actor User as Nguoi_dung

  usecase UC1 as Dang_nhap_email_mat_khau
  usecase UC2 as Dang_xuat
  usecase UC3 as Quen_mat_khau_dat_lai
  usecase UC4 as MFA_thiet_lap_bat_tat
  usecase UC5 as Xac_thuc_2FA_khi_dang_nhap
  usecase UC6 as Kiem_tra_loi_moi
  usecase UC7 as Dang_ky_tu_loi_moi
  usecase UC8 as Lay_Cap_nhat_ho_so
  usecase UC9 as Dong_bo_quyen_SPA

  Guest --> UC1
  Guest --> UC6
  Guest --> UC7
  User --> UC1
  User --> UC2
  User --> UC3
  User --> UC4
  User --> UC5
  User --> UC8
  User --> UC9
```



---

## 3. Tổ chức, người dùng, tòa nhà (BQL / Owner)

```mermaid
useCaseDiagram
  actor Owner
  actor Manager
  actor Staff
  actor Admin

  usecase O1 as CRUD_to_chuc_org
  usecase O2 as Xem_sua_toa_trong_org
  usecase U1 as CRUD_nguoi_dung
  usecase U2 as Loi_moi_thanh_vien
  usecase U3 as Xem_danh_sach_BQL_org
  usecase P1 as CRUD_toa_nha
  usecase P2 as CRUD_tang
  usecase P3 as CRUD_phong
  usecase P4 as Template_phong
  usecase P5 as Dashboard_toa

  Admin --> O1
  Admin --> P1
  Admin --> P2
  Admin --> P3
  Admin --> U1

  Owner --> O1
  Owner --> U1
  Owner --> U2
  Owner --> U3
  Owner --> P1
  Owner --> P2
  Owner --> P3
  Owner --> P4
  Owner --> P5

  Manager --> O2
  Manager --> U1
  Manager --> U2
  Manager --> P1
  Manager --> P2
  Manager --> P3
  Manager --> P4
  Manager --> P5

  Staff --> P1
  Staff --> P2
  Staff --> P3
  Staff --> P5
```



---

## 4. Hợp đồng & hóa đơn

```mermaid
useCaseDiagram
  actor Owner
  actor Manager
  actor Staff
  actor Tenant

  usecase C1 as Tao_sua_xem_hop_dong
  usecase C2 as Quan_ly_thanh_vien_HD
  usecase C3 as Ky_kich_hoat_HD
  usecase C4 as Upload_tai_lieu_HD
  usecase I1 as Phat_hanh_hoa_don
  usecase I2 as Xem_hoa_don
  usecase I3 as Dieu_chinh_hoa_don
  usecase I4 as Hoa_don_nhanh_theo_phong
  usecase I5 as Chi_phi_expenses

  Owner --> C1
  Owner --> C2
  Owner --> C4
  Owner --> I1
  Owner --> I2
  Owner --> I3
  Owner --> I4
  Owner --> I5

  Manager --> C1
  Manager --> C2
  Manager --> C4
  Manager --> I1
  Manager --> I2
  Manager --> I3
  Manager --> I4
  Manager --> I5

  Staff --> C1
  Staff --> I2
  Staff --> I4

  Tenant --> C3
  Tenant --> I2
```



---

## 5. Tài chính — thanh toán, sổ cái, VNPay

```mermaid
useCaseDiagram
  actor Owner
  actor Manager
  actor Staff
  actor Tenant
  actor VNPay as He_thong_VNPay

  usecase F1 as Ghi_nhan_thanh_toan
  usecase F2 as Huy_giao_dich_void
  usecase F3 as Xem_so_cai_ledger
  usecase F4 as Tao_URL_VNPay
  usecase F5 as IPN_xac_nhan_VNPay
  usecase F6 as Duyet_tu_choi_chung_tu_tenant
  usecase F7 as Xem_danh_sach_thanh_toan

  Owner --> F1
  Owner --> F2
  Owner --> F3
  Owner --> F4
  Owner --> F6
  Owner --> F7

  Manager --> F1
  Manager --> F2
  Manager --> F3
  Manager --> F4
  Manager --> F6
  Manager --> F7

  Staff --> F7
  Staff --> F1

  Tenant --> F4
  Tenant --> F7
  usecase F8 as Gui_bang_chung_chuyen_khoan
  Tenant --> F8

  VNPay --> F5
```



---

## 6. Đồng hồ & chỉ số

```mermaid
useCaseDiagram
  actor Owner
  actor Manager
  actor Staff
  actor Tenant

  usecase M1 as CRUD_dong_ho
  usecase M2 as Tao_chi_so_chot
  usecase M3 as Duyet_chi_so
  usecase M4 as Xem_lich_su_chi_so
  usecase M5 as Xem_dong_ho_phong_minh

  Owner --> M1
  Owner --> M2
  Owner --> M3
  Owner --> M4

  Manager --> M1
  Manager --> M2
  Manager --> M3
  Manager --> M4

  Staff --> M2
  Staff --> M4

  Tenant --> M5
  usecase M6 as Gui_chi_so_tu_tenant
  Tenant --> M6
```



---

## 7. Vận hành — ticket & bàn giao

```mermaid
useCaseDiagram
  actor Owner
  actor Manager
  actor Staff
  actor Tenant

  usecase T1 as Tao_sua_xem_ticket
  usecase T2 as Cap_nhat_trang_thai_ticket
  usecase H1 as Quan_ly_ban_giao_phong
  usecase H2 as Xem_ban_giao_lien_quan_HD

  Owner --> T1
  Owner --> T2
  Owner --> H1

  Manager --> T1
  Manager --> T2
  Manager --> H1

  Staff --> T1
  Staff --> T2
  Staff --> H1

  Tenant --> T1
  Tenant --> H2
```



---

## 8. Portal Tenant — gói use case riêng

```mermaid
useCaseDiagram
  actor Tenant

  usecase A1 as Bang_dieu_khien
  usecase A2 as Xem_hoa_don_va_cong_no
  usecase A3 as Thanh_toan_VNPay_return
  usecase A4 as Gui_chung_tu_thanh_toan
  usecase A5 as Xem_hop_dong_cho_ky
  usecase A6 as Xem_phong_cua_toi
  usecase A7 as So_do_toa_nha
  usecase A8 as Tin_nhan
  usecase A9 as Phieu_yeu_cau

  Tenant --> A1
  Tenant --> A2
  Tenant --> A3
  Tenant --> A4
  Tenant --> A5
  Tenant --> A6
  Tenant --> A7
  Tenant --> A8
  Tenant --> A9
```



---

## Liên kết

- Luồng kỹ thuật request / multi-tenant / EDA: `[system_flows.md](./system_flows.md)`
- Luồng theo role trên SPA (path): `[SAAS_MULTI_TENANT_AUDIT.md](./SAAS_MULTI_TENANT_AUDIT.md)` mục 1–2 (bổ sung)

