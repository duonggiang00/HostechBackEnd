# RBAC Permission Matrix

This matrix is automatically extracted from the system Policies and represents the "Source of Truth" for role-based access control.

## Role Definitions

- **Owner**: Full access to the organization and all its properties.
- **Manager**: Full access to assigned properties within the organization.
- **Staff**: Operational access (Read/limited Update) to specialized modules.
- **Tenant**: Access restricted to their own contracts, rooms, and billing.

## Module Permissions

| Module | Owner | Manager | Staff | Tenant | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **AuditLog** | R | - | - | - | |
| **Contracts** | CRUD | CRUD | R | R | Tenant access is scoped to their own contract members. |
| **Floor** | CRUD | CRUD | R | - | |
| **Handover** | CRUD | CRUD | CRUD | - | |
| **Invoice** | CRUD | CRUD | R | R | |
| **Meter** | CRUD | CRUD | R | - | |
| **MeterReading** | CRUD | CRUD | CR | CR | |
| **Orgs** | CRUD | - | - | - | |
| **Payment** | CRUD | CRUD | R | R | |
| **Room** | CRUD | CRUD | RU | R | |
| **RoomAsset** | CRUD | CRUD | V | V | |
| **Services** | CRUD | CRUD | R | R | |
| **Ticket** | CRUD | CRUD | RU | CR | Tenants can Create tickets; Staff can Update status. |
| **UserInvitations** | CRUD | CR | - | - | Managers can invite Staff/Tenants. |
| **Users** | CRUD | CRUD | R | - | |

## Legend

- **C**: Create
- **R**: Read / View
- **U**: Update / Edit
- **D**: Delete
- **V**: View (equivalent to R)
- **-**: No access
- **CRUD**: Full access

> [!NOTE]
> All permissions are automatically scoped by the `MultiTenant` trait (Organization) and `HandlesPropertyScope` trait (Property) unless otherwise specified in the Policy file.
