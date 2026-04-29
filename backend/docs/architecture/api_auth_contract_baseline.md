# API auth and session contract baseline

Single reference for **login**, **two-factor login**, and **profile** JSON shapes and for **Spatie permission** naming used by the SPA and `php artisan rbac:sync`.

## Permission naming (`rbac:sync`)

- Format: `{action} {ModuleName}` (e.g. `view Invoice`, `create Contracts`).
- `{action}` comes from [app/Enums/RbacAction.php](../../app/Enums/RbacAction.php) when syncing from policies.
- `{ModuleName}` is `SomePolicy::getModuleName()` (see [app/Services/RbacService.php](../../app/Services/RbacService.php)).

### Valid shorthand in `getRolePermissions()` string values

Only these characters are expanded by `RbacAction::fromShortMap`:

- `C` → create  
- `R` → viewAny + view  
- `U` → update (+ updateAny)  
- `D` → delete family  
- `*` → all cases  

The entire string `-` means **no permissions** synced for that role/module (empty expansion is acceptable). Do not use other letters (e.g. `V`) — they silently produce **no** permissions.

## POST login success (`LoginResponse`)

Implemented in [app/Http/Responses/Auth/LoginResponse.php](../../app/Http/Responses/Auth/LoginResponse.php).

| Field | Type | Notes |
|--------|------|--------|
| `user.id` | string | UUID |
| `user.full_name`, `email`, `phone` | string / nullable | |
| `user.org_id` | string \| null | |
| `user.role` | string \| null | First Spatie role name (routing hint) |
| `user.roles` | string[] | All role names |
| `user.permissions` | string[] | `getAllPermissions()->pluck('name')` — same source as profile |

| `token` | string | Sanctum plain text token |

## POST 2FA login success (`TwoFactorLoginResponse`)

Implemented in [app/Http/Responses/Auth/TwoFactorLoginResponse.php](../../app/Http/Responses/Auth/TwoFactorLoginResponse.php).

**Must match** the same `user` RBAC subset as password login (`role`, `org_id`, `roles`, `permissions`, string `id`) so the SPA can hydrate `PermissionGate` without a second auth-specific endpoint.

## GET `/api/profile` (`UserResource`)

Implemented in [app/Http/Resources/Org/UserResource.php](../../app/Http/Resources/Org/UserResource.php).

Includes full profile fields plus `role`, `roles`, `permissions`, `properties` (Manager/Staff), and optional `assigned_rooms` when loaded. The SPA should merge `permissions` (and `roles` / `properties`) into the auth store after login (see session bootstrap in frontend).

## Admin bypass

Users with Spatie role **`Admin`** pass all policy checks via `Gate::before` in [app/Providers/AuthServiceProvider.php](../../app/Providers/AuthServiceProvider.php). They are not listed in per-policy `getRolePermissions()` tables.

## Related docs

- [rbac_matrix.md](./rbac_matrix.md) — role × module matrix (human-readable).
- [BILLING_FINANCE_MODULE_FULL_GUIDE.md](../project_specs/BILLING_FINANCE_MODULE_FULL_GUIDE.md) — ledger endpoints semantics.

## Automated checks

- Policy shorthand guard: [tests/Feature/RbacPolicyRegistrationTest.php](../../tests/Feature/RbacPolicyRegistrationTest.php) (invalid characters in `getRolePermissions()` strings / invalid enum strings in arrays).
