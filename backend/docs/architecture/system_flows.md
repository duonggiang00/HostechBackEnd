# System Flows & Request Lifecycle

This document describes the standard lifecycle of a request in the Hostech backend and how various architectural components interact.

## 1. Request Lifecycle Overview

1.  **Entry Point**: `public/index.php` (Laravel standard).
2.  **Global Middleware**: standard Laravel middleware (TrimStrings, etc.).
3.  **Authentication**: `Authenticate` middleware (Sanctum/Fortify).
4.  **Multi-Tenancy Resolution**: [ResolveTenant middleware](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/app/Http/Middleware/ResolveTenant.php).
    - Sets the current `org_id` and `property_id` in the `TenantManager`.
    - If user is NOT an Admin, `org_id` is forced from the User's record.
    - If user IS an Admin, `org_id` can be passed via headers or query params.
5.  **Authorization**: Spatie Middleware / Gates / [AuthServiceProvider](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/app/Providers/AuthServiceProvider.php).
6.  **Controller**: Validates input using `FormRequest` and delegates logic to **Services**.
7.  **Service Layer**: Executes business logic, interacts with multiple Models, and dispatches **Events**.
8.  **Database/Queue**: Models use `MultiTenant` trait to auto-scope queries. Long-running tasks transition to **Jobs**.
9.  **Response**: Formatted JSON via API Resources.

## 2. Multi-Tenancy Mechanism

The system implements multi-tenancy at the database level using a **Global Scope**.

- **Trait**: `App\Models\Concerns\MultiTenant`
- **Resolution**: `App\Services\TenantManager` holds the current context.
- **Enforcement**:
    ```php
    // In MultiTenant trait
    static::addGlobalScope('org_id', function (Builder $builder) {
        if (TenantManager::getOrgId()) {
            $builder->where('org_id', TenantManager::getOrgId());
        }
    });

    // Auto-assignment
    static::creating(function ($model) {
        if (! $model->org_id && TenantManager::getOrgId()) {
            $model->org_id = TenantManager::getOrgId();
        }
    });
    ```

## 3. Event-Driven Architecture (EDA)

Cross-module interactions are Decoupled using Events.

| Event | Primary Listener | Purpose |
| :--- | :--- | :--- |
| `RoomCreated` | `InitializeRoomServices` | Automates asset initialization for new rooms. |
| `ContractActivated` | `SnapshotContractServices` | Freezes service prices at the moment of signing. |
| `MeterReadingApproved` | `PerformMasterAggregation` | Triggers sub-meter to master-meter reconciliation. |
| `InvoiceGenerated` | `NotifyTenantInvoiceIssued` | Dispatches notifications (Email/In-app). |

## 4. Permission Synchronization (RBAC)

Permissions are not manually managed in separate files but are **derived from Policies**.

1.  Policies implement `RbacModuleProvider`.
2.  `RbacService` scans these policies.
3.  `RBACSeeder` syncs the mapping into the `permissions` table.
4.  Gate Check: `hasPermissionTo('view Contracts')` maps to `ContractPolicy::view()`.
