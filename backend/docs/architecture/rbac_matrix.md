# RBAC Permission Matrix

Human-readable matrix derived from policy `getRolePermissions()` and runtime policy rules. **Canonical permission strings** are `{action} {ModuleName}` (see [api_auth_contract_baseline.md](./api_auth_contract_baseline.md)).

## Role definitions

- **Admin**: Not granted via `rbac:sync` tables below — `Gate::before` in `AuthServiceProvider` allows **all** policy abilities.
- **Owner**: Full organization scope (subject to policy `HandlesOrgScope` / `HandlesPropertyScope` where applied).
- **Manager**: Full access on **assigned properties** (property_user) where policies use `HandlesPropertyScope`.
- **Staff**: Read or limited write per module; property-scoped where noted.
- **Tenant**: Self-service scope (membership on contracts, own payments, etc.) even when a cell shows `R` from sync.

## Module permissions

| Module | Owner | Manager | Staff | Tenant | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **AuditLog** | R | - | - | - | |
| **Contracts** | CRUD | CRUD | R | R | Tenant **view** via contract **membership** |
| **Floor** | CRUD | CRUD | R | - | Property scope |
| **Handover** | CRUD | CRUD | CRUD | - | Sync gives Tenant `-`; **view** CONFIRMED handover linked to tenant contract in `HandoverPolicy` |
| **Invoice** | CRUD | CRUD | R | R | Tenant **view** invoices of **their** contracts |
| **Meter** | CRUD | CRUD | R | - | Tenant portal uses separate `/api/app` routes for limited flows |
| **MeterReading** | CRUD | CRUD | CR | CR | **Approve** requires Manager/Owner + `update` + property scope |
| **Orgs** | CRUD | - | - | - | |
| **Payment** | CRUD | CRUD | RU | R | Staff **update** scoped: chỉ duyệt/từ chối PENDING có `meta.submitted_by_tenant` (chứng từ tenant); Tenant **view** own payments (`payer_user_id`); **create** allowed for self-service per `FinancePolicy` |
| **Properties** | CRUD | RU | R | R | Tenant **view** property only with ACTIVE/PENDING_PAYMENT contract + approved member |
| **Room** | CRUD | CRUD | RU | R | Tenant: available room or active contract on room |
| **RoomAsset** | CRUD | CRUD | R | R | Staff/Tenant use shorthand **R** (`viewAny` + `view`) — do not use invalid letters in `getRolePermissions()` |
| **Services** | CRUD | CRUD | R | R | Org scope |
| **Ticket** | CRUD | CRUD | RU | CR | Tenant **view** tickets they created |
| **UserInvitations** | CRUD | CR | - | - | |
| **Users** | CRUD | CRUD | R | - | |

## Legend

- **C**: Create  
- **R**: Read (sync expands to `viewAny` + `view`)  
- **U**: Update  
- **D**: Delete (and related delete-family actions from shorthand)  
- **-**: No permissions from `rbac:sync` for that role/module (policy may still grant special-case access)  
- **CRUD**: Full CRUD shorthand  

> All permissions are scoped by `MultiTenant` (`org_id`) and, where policies use it, `HandlesPropertyScope` (Manager/Staff assigned properties).
