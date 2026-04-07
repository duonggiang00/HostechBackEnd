# 🏗️ Phân Tích Kiến Trúc Hệ Thống Hostech

> Được tổng hợp từ **Grapuco MCP Server** — Repository: `HostechBackEnd`

---

## 1. Tổng Quan Hệ Thống

**Hostech** là một nền tảng quản lý bất động sản / cho thuê nhà trọ (Property Management System), hướng đến 3 nhóm người dùng:

| Vai trò | Mô tả |
|---|---|
| **Property Manager / Staff** | Quản lý tòa nhà, phòng, hợp đồng, hóa đơn, đồng hồ |
| **Org Admin** | Quản lý tổ chức, nhân sự, bất động sản cấp tổ chức |
| **Tenant** | Xem hóa đơn, hợp đồng, gửi yêu cầu |

---

## 2. Kiến Trúc Tổng Thể (C4 Level 1 - System Context)

```mermaid
graph TD
    PM["👤 Property Manager / Staff"]
    OA["👤 Org Admin"]
    TN["👤 Tenant"]

    subgraph Hostech["🏢 Hostech Platform"]
        FE["⚛️ FrontendV2\n(React + Vite + TypeScript)"]
        BE["🔧 Backend API\n(Laravel 11 + Sanctum)"]
        DB["🗄️ Database\n(MySQL)"]
        RT["📡 Real-time\n(Laravel Echo/Pusher)"]
    end

    PM -->|Browser| FE
    OA -->|Browser| FE
    TN -->|Browser| FE
    FE -->|REST API / JSON| BE
    BE -->|Eloquent ORM| DB
    BE -->|Broadcast Events| RT
    RT -->|WebSocket| FE
```

---

## 3. Backend Architecture (Laravel 11)

### 3.1 Layer Stack

```mermaid
graph TD
    subgraph HTTP Layer
        Routes["routes/api.php\nroutes/web.php"]
        Middleware["Auth Middleware\n(Sanctum + RBAC Policy)"]
        Controllers["API Controllers"]
    end

    subgraph Business Logic
        Services["Services (Domain Logic)"]
        Actions["Actions (Fortify)"]
        Events["Events + Listeners"]
    end

    subgraph Data Layer
        Models["Eloquent Models"]
        Observers["Model Observers"]
        DBModels["MySQL Tables"]
    end

    subgraph Cross-cutting
        Traits["Traits (HasMediaAttachments, etc.)"]
        Mails["Mailable + Notifications"]
        Commands["Artisan Commands (Scheduled)"]
    end

    Routes --> Middleware --> Controllers
    Controllers --> Services --> Models
    Models --> DBModels
    Services --> Events --> Listeners
    Listeners --> Mails
    Models --> Observers
    Commands --> Services
```

### 3.2 Domain Modules (Backend)

| Domain Module | Controllers | Services | Models | Mô tả |
|---|---|---|---|---|
| **Auth** | TwoFactorAuthenticationController | MfaService, UserInvitationService | User | Login, MFA, OTP, Invite |
| **Property** | PropertyController, BuildingOverviewController | PropertyService, RoomService, FloorService | Property, Room, Floor | CRUD tòa nhà, phòng, tầng |
| **Contract** | ContractController, ContractDocumentController | ContractService, ContractDocumentService | Contract, ContractMember | Ký hợp đồng, scan OCR, PDF |
| **Invoice** | InvoiceController, InvoiceAdjustmentController | InvoiceService, RecurringBillingService | Invoice, InvoiceAdjustment, InvoiceItem | Hóa đơn định kỳ, điều chỉnh |
| **Meter** | MeterController, MeterReadingController | MeterReadingService | Meter, MeterReading | Đồng hồ điện/nước |
| **Finance** | PaymentController, VNPayController | PaymentService | Payment | Thanh toán, VNPay IPN |
| **Service** | RoomServiceController | ServiceService | Service, RoomService | Dịch vụ đính kèm phòng |
| **Ticket** | TicketController | TicketService | Ticket | Phiếu yêu cầu bảo trì |
| **Org** | OrgController, UserController | OrgService | Org, User, Role | Tổ chức, nhân viên |
| **Dashboard** | DashboardController | — | — | Thống kê tổng hợp |
| **Handover** | HandoverController | HandoverService | Handover | Bàn giao phòng |
| **Notification** | NotificationController, NotificationRuleController | NotificationService | Notification | Thông báo, rules |
| **System** | UploadController | — | TemporaryUpload | Media upload tạm |

### 3.3 Scheduled Commands (Artisan)

| Command | Mô tả |
|---|---|
| `contracts:expire` | Tự động EXPIRED hợp đồng hết hạn |
| `app:generate-recurring-invoices` | Sinh hóa đơn định kỳ hàng tháng |
| `media:cleanup-temp` | Xóa file upload tạm > 24h |
| `rbac:sync` | Đồng bộ quyền RBAC vào DB |

### 3.4 Real-time Events

| Event | Channel | Trigger |
|---|---|---|
| `MeterReadingStatusChanged` | `private.property.{id}`, `private.user.{id}` | Khi chỉ số đồng hồ được APPROVED |
| `BuildingOverviewUpdated` | — | Khi sync sơ đồ tòa nhà |

---

## 4. Frontend Architecture (React + Vite + TypeScript)

### 4.1 Scope-based Architecture

Frontend được chia theo **3 Scope độc lập**, mỗi scope có layout, routes, features riêng:

```mermaid
graph TD
    App["App.tsx\n(Router Root)"]
    
    App --> PS["🏢 PropertyScope\n/property/*"]
    App --> OS["🏛️ OrgScope\n/org/*"]
    App --> TS["👤 TenantScope\n/tenant/*"]
    App --> SH["🔄 Shared\n(cross-scope)"]

    PS --> PS_F["Features:\nbilling, building-overview,\ncontracts, dashboard, metering,\noperations, properties, rooms,\nselect-property, services,\ntemplates, tickets, users"]

    OS --> OS_F["Features:\nbilling, finance,\norganizations, properties, staff"]

    TS --> TS_F["Features:\nbilling, contracts,\ndashboard, messaging, requests"]

    SH --> SH_M["Shared Modules:\napi/, components/, context/,\nhooks/, layouts/, pages/,\ntypes/, utils/"]
```

### 4.2 Feature Module Structure (Per Feature)

Mỗi feature trong từng Scope tuân theo **Feature-based architecture**:

```
{Scope}/features/{feature}/
├── api/          # axios/fetch calls → backend API
├── components/   # React components của feature
├── hooks/        # Custom hooks (useQuery, useMutation)
├── pages/        # Page-level components (route entry)
├── types/        # TypeScript types/interfaces
└── schema/       # Zod validation schemas (nếu có)
```

### 4.3 PropertyScope Features Chi Tiết

| Feature | Trang chính | Chức năng |
|---|---|---|
| `properties` | `PropertyDetailPage` | Chi tiết bất động sản + tab navigation |
| `building-overview` | `BuildingOverviewPage` | Sơ đồ tòa nhà (drag & drop rooms) |
| `rooms` | `RoomListPage`, `RoomDetailPage` | Danh sách & chi tiết phòng |
| `contracts` | `ContractListPage`, `ContractDetailPage` | Hợp đồng thuê |
| `billing` | `BillingPage` | Hóa đơn & thanh toán |
| `metering` | `MeteringPage` | Quản lý chỉ số đồng hồ |
| `services` | `ServicesPage` | Dịch vụ (điện, nước, wifi...) |
| `tickets` | `TicketsPage` | Phiếu bảo trì |
| `operations` | `OperationsPage` | Vận hành tổng hợp |
| `dashboard` | `DashboardPage` | Thống kê nhanh |
| `users` | `UsersPage` | Quản lý nhân sự tại property |
| `select-property` | `SelectPropertyPage` | Chọn tòa nhà |
| `templates` | `nav.ts`, `routes.tsx` | Template nav & routes |

### 4.4 Navigation Architecture (PropertyScope)

```mermaid
graph LR
    Root["/property/:propertyId"]
    Root --> Overview["building-overview\n📊 Sơ đồ tầng"]
    Root --> Rooms["rooms/*\n🚪 Danh sách phòng"]
    Root --> Contracts["contracts/*\n📋 Hợp đồng"]
    Root --> Billing["billing/*\n💰 Hóa đơn"]
    Root --> Metering["metering/*\n⚡ Đồng hồ"]
    Root --> Services["services/*\n🔧 Dịch vụ"]
    Root --> Tickets["tickets/*\n🎫 Yêu cầu"]
    Root --> Operations["operations/*\n⚙️ Vận hành"]
```

---

## 5. Data Flows (API → Service → DB)

Các luồng dữ liệu quan trọng nhất được phát hiện bởi Grapuco:

### 5.1 Luồng Hóa Đơn & Thanh Toán

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as API Controller
    participant SVC as InvoiceService
    participant DB as Database

    FE->>API: POST /invoices/generate-monthly
    API->>SVC: RecurringBillingService.generate()
    SVC->>SVC: resolveBillingCycleMonths()
    SVC->>SVC: calculateMeterUsage()
    SVC->>SVC: getRoomServices()
    SVC->>DB: Invoice.items (write)

    FE->>API: POST /finance/payments
    API->>SVC: PaymentService.record()
    SVC->>SVC: recordStatusHistory()
    SVC->>SVC: activateContractIfInitialInvoice()
    SVC->>DB: Payment (write)
```

### 5.2 Luồng Ký Hợp Đồng

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as ContractController
    participant SVC as ContractService / DocumentService
    participant DB as Database

    FE->>API: POST /contracts/{id}/sign
    API->>SVC: ContractService.sign()
    SVC->>SVC: allowAcceptSignature() (validate status)
    SVC->>SVC: contractMembersHasSignedAtColumn()
    SVC->>DocumentService: resolveTemplatePath()
    DocumentService->>DocumentService: createDefaultTemplate()
    SVC->>DB: Contract.invoices (create initial invoice)
    SVC->>DB: Contract.members (update signed_at)
```

### 5.3 Luồng VNPay IPN

```
POST /finance/vnpay/ipn
  → VNPayController.handleIpn()
  → InvoiceService.recordStatusHistory()
  → InvoiceService.activateContractIfInitialInvoice()
```

### 5.4 Luồng Building Overview Sync

```
POST /properties/{id}/overview/sync
  → BuildingOverviewController.sync()
  → RoomService.quickCreate() (tạo phòng mới)
  → Property.floors (load tầng)
  → Room.assets (load assets)
  → HasMediaAttachments.syncMediaAttachments()
  → Property.defaultServices (gán dịch vụ mặc định)
```

### 5.5 Luồng Tenant (Frontend → Backend)

| Frontend Page | API Calls | Backend Terminal |
|---|---|---|
| `TenantBillingPage` | GET invoices | `Invoice.items`, `Invoice.adjustments` |
| `TenantContractDetailPage` | GET contract detail | `Invoice.items`, `Invoice.adjustments`, `InvoiceAdjustment.isApproved` |
| `TenantBillingPage` | POST payment via VNPay | `InvoiceService.activateContractIfInitialInvoice` |

---

## 6. Authentication & Authorization

```mermaid
graph TD
    Login["POST /login\n(Laravel Fortify)"]
    Login --> MFA{MFA Enabled?}
    MFA -->|TOTP| TOTP["Verify TOTP\n(Google Authenticator)"]
    MFA -->|Email OTP| OTP["Send OTP Email\nOTPMail"]
    MFA -->|No| Session["Create Sanctum Token"]
    TOTP --> Session
    OTP --> Session
    Session --> RBAC["RBAC Policy Check\n(per Controller action)"]
    RBAC --> Action["Execute Action"]
```

**RBAC Flow:**
- `RbacService.sync()` quét tất cả Policies và tạo permissions trong DB
- Mỗi request qua Middleware → kiểm tra `Gate::authorize()`
- Artisan command `rbac:sync` để re-sync sau khi thêm policy mới

---

## 7. Sơ Đồ Kiến Trúc Toàn Cục

```mermaid
graph TD
    subgraph Client["🖥️ Client (Browser)"]
        FE_PS["PropertyScope\n12+ features"]
        FE_OS["OrgScope\n5 features"]
        FE_TS["TenantScope\n5 features"]
        FE_SH["Shared\n(components, hooks, api)"]
    end

    subgraph API["🔧 Laravel 11 API"]
        Auth["Auth Module\n(Fortify + MFA)"]
        Prop["Property Module"]
        Contract["Contract Module"]
        Invoice["Invoice Module"]
        Finance["Finance Module\n(VNPay)"]
        Meter["Meter Module"]
        Service["Service Module"]
        Ticket["Ticket Module"]
        Org["Org Module"]
        Dashboard["Dashboard"]
    end

    subgraph Background["⏰ Background"]
        Scheduler["Laravel Scheduler"]
        ExpireCmd["contracts:expire"]
        BillingCmd["generate-recurring-invoices"]
        CleanCmd["media:cleanup-temp"]
        RbacCmd["rbac:sync"]
    end

    subgraph Infra["🗄️ Infrastructure"]
        MySQL["MySQL Database"]
        Redis["Redis (Session/Cache)"]
        Storage["File Storage\n(Spatie Media)"]
        Pusher["WebSocket\n(Pusher/Echo)"]
    end

    FE_PS & FE_OS & FE_TS --> API
    FE_SH --> FE_PS & FE_OS & FE_TS
    API --> MySQL
    API --> Redis
    API --> Storage
    API --> Pusher
    Pusher --> FE_PS
    Scheduler --> ExpireCmd & BillingCmd & CleanCmd & RbacCmd
    BillingCmd --> Invoice
    ExpireCmd --> Contract
```

---

## 8. Điểm Mạnh Kiến Trúc

| Điểm mạnh | Chi tiết |
|---|---|
| ✅ **Feature-based Frontend** | Mỗi feature độc lập, dễ mở rộng |
| ✅ **3-Scope Separation** | PropertyScope / OrgScope / TenantScope rõ ràng |
| ✅ **Service Layer** | Business logic tách khỏi Controller |
| ✅ **RBAC Policy-based** | Phân quyền tập trung, có thể sync tự động |
| ✅ **Event-driven** | Broadcast real-time cho meter reading |
| ✅ **Scheduled Jobs** | Tự động hóa billing, contract expiry |
| ✅ **Domain-grouped Models** | Models nhóm theo domain (Contract/, Invoice/, Property/) |

## 9. Điểm Cần Cải Thiện / Rủi Ro

| Vấn đề | Mô tả |
|---|---|
| ⚠️ **flowSummary = null** | Grapuco chưa có mô tả ngữ nghĩa cho data flows |
| ⚠️ **Combine UI Designs** | Còn thư mục `Combine UI Designs/` trong repo — có thể là code thừa |
| ⚠️ **TenantScope còn ít** | Chỉ có 5 features, có thể chưa hoàn thiện |
| ⚠️ **No GraphQL** | Toàn bộ REST — có thể bottleneck với màn hình phức tạp nhiều data |
| ⚠️ **VNPay IPN** | Cần bảo vệ endpoint IPN khỏi replay attack |

---

*Phân tích được tổng hợp lúc: 2026-04-07 | Nguồn: Grapuco MCP + Filesystem scan*
