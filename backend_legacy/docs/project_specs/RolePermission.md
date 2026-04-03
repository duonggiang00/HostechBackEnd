# Role-Based Access Control (RBAC) System

This system uses a **Dynamic Permission** model powered by Spatie Laravel Permission.

## 1. Role Hierarchy & Scope

| Role | Scope | Description |
| :--- | :--- | :--- |
| **Admin** | **System-wide** | Super User. Bypasses all scope checks. Can manage everything. |
| **Owner** | **Organization** | Full control over a single Organization and its resources. |
| **Manager** | **Property** | Can manage specific Properties (Floors, Rooms) assigned to them. |
| **Staff** | **Property** | Limited operational access (View, Update status) within a Property. |
| **Tenant** | **Room** | Customer level. Can only view their assigned Room/Contract. |

## 2. Permission Matrix (CRUD)

| Module \ Role | Admin | Owner (Org) | Manager (Prop) | Staff (Prop) | Tenant (Room) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Users** | * | CRUD | R | - | - |
| **Organizations** | * | R, U | - | - | - |
| **Properties** | * | CRUD | R, U | R | - |
| **Floors** | * | CRUD | CRUD | R | - |
| **Rooms** | * | CRUD | CRUD | R, U | R |

> **Note:**
> - `*`: Full Access (Bypass)
> - `CRUD`: Create, Read, Update, Delete
> - `R, U`: Read, Update
> - `-`: No Access

## 3. Scope Logic

The system automatically scopes queries based on the user's role:

- **Admin**: `TenantManager::getOrgId()` returns `null` => No scope applied (View All).
- **Owner**: `TenantManager::getOrgId()` returns `user->org_id` => Scoped to Org.
- **Manager/Staff**: Scoped to Org AND specific assigned Properties (via logic in Services/Policies).

## 4. Default Accounts (Seeder)

- **System Admin**: `admin@example.com` / `password`
- **Sample Owner**: `owner@example.com` / `password`


