# Comprehensive Frontend Rebuild Implementation Plan

## Goal Description
Following a strategic decision, the current frontend features will be rebuilt from the ground up ("đập đi xây lại toàn bộ"). The objective is to achieve **100% feature parity** perfectly aligned with the backend APIs. 

**Critical Mandate**: This rebuild MUST rigorously enforce Role-Based Access Control (RBAC) at the component and route level, fundamentally prepare the application for **Phase D2 (Multi-Space Architecture)**, and include **mandatory quality audits** after the completion of every sub-phase.

## Architectural Guardrails (Strict Enforcement)

### 1. Phase D2 Multi-Space Architecture Foundation
The semantic routing structure must be built into the core layout from Day 1:
- `/auth/*`: LayoutAuth (Public).
- `/manage/*`: LayoutManage (Management Space for Owner, Manager, Staff). Desktop-first.
- `/me/*`: LayoutPortal (Portal Space for Tenants). Mobile-first. Scoped to membership.
- `/admin/*`: LayoutSysAdmin (System Admin view for overall platform management).

### 2. Strict RBAC Implementation
- **Route Level**: `<ProtectedRoute>` will wrap all non-public spaces.
- **Component Level**: Mandatory use of `<RequireRole>` wrapper component to fundamentally hide/disable actions (Create/Update/Delete buttons) from unauthorized users.
- **Zero-Mock Policy**: Absolutely no hardcoded fallback data. 

### 3. State Management Rule
- **Server State**: 100% TanStack React Query (`useQuery`, `useMutation`).
- **Client State**: Zustand for UI toggles only.

### 4. Continuous Navigation Audit
- Every phase completion requires an evaluation of `sidebar-config.tsx` and `Sidebar.tsx`.
- The Sidebar MUST accurately reflect the implemented Multi-Space routing without broken or 404 links.

---

## Testing Logistics
The following standard accounts are used for all manual end-to-end verifications.
- **Admin**: `admin@example.com`
- **Owner**: `ca-ngo_owner@example.com`
- **Manager**: `ca-ngo_manager@example.com`
- **Staff**: `ca-ngo_staff@example.com`
- **Tenant 1**: `ca-ngo_tenant_m38y@example.com`
- **Tenant 2**: `ca-ngo_tenant_V3aU@example.com`
*(Password for all accounts: `12345678`)*

---

## 100% Parity Roadmap Phases & Task Breakdowns

*(Workflow Rule: Scaffold -> Extend -> Audit for every module)*

### Phase 1: Core Foundation & Shared Services (Week 1)
*Focus: Setting up the Multi-Space router and core system modules.*

#### 1.1 Multi-Space Routing & Auth Rebuild
- **Task**: Create `LayoutAuth`, `LayoutManage`, `LayoutPortal`, `LayoutSysAdmin`.
- **Task**: Rebuild Login/Register UI.
- **Task**: Integrate TOTP 2FA UI (`GET/POST /api/mfa-status`).
- **Task**: Avatar Upload integrating `<MediaUploader />`.
- **Task**: Xây dựng chức năng Đăng xuất (Logout) triệt để cho mọi không gian (đặc biệt là Portal Space của Tenant) hủy token an toàn qua `POST /api/auth/logout`.
- **Mandatory Audit 1.1**: Rà soát lại Routing Guards `<ProtectedRoute>`, check rò rỉ JWT Token, verify Zustand `AuthStore` hydration, test luồng Logout.

#### 1.2 Org & User Management
- **Task**: Views for Owner/Manager to invite and assign roles flexibly (`Spatie/RolePermissions`).
- **Task**: Org context switcher UI.
- **Mandatory Audit 1.2**: Test xuyên chéo các account (Owner, Manager, Staff) xem UI có cấm hiển thị chính xác các nút bấm nhạy cảm qua `<RequireRole>` hay không.

#### 1.3 System, Audit & Media Hub
- **Task**: Secure `/manage/audit-logs` table (`GET /api/audit-logs`).
- **Task**: Build `<MediaUploader />` bridging `POST /api/media/upload`.
- **Task**: Token validation and registration workflow (`/api/invitations`).
- **Mandatory Audit 1.3**: Rà soát component `<MediaUploader />` có thể tái sử dụng dễ dàng ở Tickets và Handovers chưa? Verify API payloads.

---

### Phase 2: Operations & Hierarchy (Week 2)
*Focus: The structural backbone under `/manage` with hyper-strict RBAC.*

#### 2.1 Property, Floor & Room Assets 
- **Task**: Nested Antd Tables to CRUD Properties -> Floors -> Rooms (`/manage/properties`). Bao gồm upload ảnh Properties và Rooms dùng `<MediaUploader />`.
- **Task**: Room Asset Manager UI.
- **Mandatory Audit 2.2**: Rà soát performance của Nested Tables (có N+1 render ở React không), verify các query keys của React Query đã tối ưu cache chưa.

#### 2.3 Services Catalog
- **Task**: Org-wide services catalog management (`/manage/services`).
- **Task**: `<RoomServiceAssigner />` mapping global services to specific rooms.
- **Mandatory Audit 2.3**: Kiểm tra validation của `custom_price` inputs.

---

### Phase 3: Core Business Workflows (Week 3)
*Focus: Bridging `/manage` and `/me` with Contracts and Finances.*

#### 3.1 Contracts (Admin `/manage` & Tenant `/me`)
- **Task**: CRUD Contracts & `ContractMembers` for Managers (`/manage`). Tích hợp `<MediaUploader />` để lưu trữ bản scan hợp đồng chứng từ.
- **Task**: Early Termination flows.
- **Task**: E-Signature flow (`GET /my-pending` -> `POST /accept-signature`) in Tenant Portal (`/me`).
- **Task**: Self-Service flows for roommates and transfers (`/me`).
- **Mandatory Audit 3.1**: Verify State thay đổi phức tạp của Hợp Đồng. Check luồng Tenant Portal bị block/chặn routing nếu chưa ký Hợp đồng (Dormant Tenant).

#### 3.2 Invoices & Adjustments (`/manage` & `/me`)
- **Task**: Invoice Generator with Hierarchical billing logic (`/manage`).
- **Task**: Status transition management (DRAFT -> SENT). Đòi hỏi tính toán `total_amount` chính xác từ `InvoiceItems`.
- **Task**: Tenant View (`/me/invoices`): Bảng hóa đơn chỉ hiển thị trạng thái SENT hoặc PAID của chính Tenant.
- **Task**: Tenant View: Chi tiết hóa đơn, xem QR Code thanh toán và nút Tải PDF.
- **Mandatory Audit 3.2**: Rà soát Form Array của Invoice Items (với `useFieldArray`), fix lỗi re-render. Verify tính toán số tổng `total_amount` ở Client khớp với DB. Kiểm duyệt Tenant không đọc được hóa đơn phòng khác.

---

### Phase 4: Facilities & Issue Tracking (Week 4)

#### 4.1 Meters & Utility Processing (`/manage`)
- **Task**: Excel-like DataGrid for rapid utility reading entries. Tích hợp chức năng upload ảnh mặt đồng hồ qua `<MediaUploader />`.
- **Task**: Workflow for managers to approve/reject utility corrections (Adjustments Notes).
- **Mandatory Audit 4.1**: Rà soát khả năng nhập tay nhanh, bulk-update (debounced mutations) để giảm request spam lên server.

#### 4.2 Tickets (Incident Management)
- **Task**: Manager Kanban (`/manage/tickets`) - Kéo thả đổi trạng thái (OPEN -> RECEIVED -> IN_PROGRESS -> WAITING_PARTS -> DONE).
- **Task**: Assign Staff, input Costs (`TicketCost`), đổi Status. Hiển thị Timeline Events (`CREATED`, `STATUS_CHANGED`, `COMMENT`).
- **Task**: Tenant Submission Flow (`/me/tickets`): Form báo sự cố `POST /api/tickets` đính kèm Media.
- **Task**: Tenant Tracking Flow (`/me/tickets`): Xem trạng thái xử lý, cho phép Tenant chủ động thêm Binh luận (`POST /api/tickets/{id}/events` - Loại COMMENT).
- **Mandatory Audit 4.2**: Verify React Query optimistic updates khi kéo thả thẻ (cards) trong Kanban board. Rà soát Tenant Scoping cứng (`created_by_user_id`), đảm bảo tuyệt đối Tenant X không thấy Ticket của Tenant Y.

#### 4.3 Handovers (Check-in/Check-out)
- **Task**: Interactive checklist form for Staff to mark `HandoverItems` status.
- **Task**: Lock snapshots functionality.
- **Mandatory Audit 4.3**: Review UI Form trạng thái động (Dynamic Form) cho danh mục tài sản lớn.

---

### Phase 5: Dashboards & Reporting (Week 5)
- **Task**: Role-specific dashboards on `/manage` (Occupancy, Revenue) and `/admin` (System globals).
- **Mandatory Audit 5.1**: Kiểm tra tải trọng của Chart Components.

## Execution Requirements
1. The executing agent MUST use `/scaffold_frontend_module` -> `/extend_frontend_module`.
2. Upon completing the sub-tasks for a module (e.g., 1.1), the executing agent MUST invoke the `/audit_frontend_module` workflow to execute the **Mandatory Audit** step before progressing to the next module.
