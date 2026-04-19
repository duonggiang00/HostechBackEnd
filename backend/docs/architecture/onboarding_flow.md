# Onboarding & Invitation Workflows

This document clarifies the different mechanisms for bringing users (Staff and Tenants) into the system.

## 1. Staff Onboarding (Hiring)

Staff onboarding is a "Push-based" workflow where a Manager or Owner explicitly invites a team member.

1.  **Requirement**: Manager/Owner must have `create UserInvitations` permission.
2.  **Action**: Manager calls `POST /api/user-invitations` with `role_name = 'Staff'`.
3.  **Scope**: Manager can optionally restrict the staff member to specific buildings using `properties_scope`.
4.  **Acceptance**: The invitee receives an email with a unique token and registers via the invitations-exclusive registration flow.
5.  **Result**: A new `User` record is created with the `Staff` role, linked to the `org_id`.

## 2. Tenant Onboarding (Leasing)

Tenant onboarding is more complex as it involves both system access (User account) and legal/financial access (Contract).

### A. The System Invitation (Account Creation)
1.  **Action**: Manager calls `POST /api/user-invitations` with `role_name = 'Tenant'`.
2.  **Result**: Invitee creates a account. At this point, they can log in but have **no data** to view because they are not yet members of any contract.

### B. The Contract Binding (Member Management)
1.  **Action**: Manager creates a `Contract` and adds the Tenant's `user_id` via [ContractMemberController](file:///c:/laragon/www/laravel/datn/HostechBackEnd/backend/app/Http/Controllers/Api/Contract/ContractMemberController.php).
2.  **Role**: The user is assigned a specific role within the contract: `TENANT` (Primary), `ROOMMATE`, or `GUARANTOR`.
3.  **Result**: The Tenant can now view the contract, its invoices, and room details as authorized by the `ContractPolicy`.

### C. The Contract Activation (Signature)
1.  **Action**: The Primary Tenant "Signs" the contract (`POST /api/contracts/{id}/sign`).
2.  **Event**: Dispatches `ContractActivated`.
3.  **Listener**: `SnapshotContractServices` freezes the current service prices for this contract to prevent future price changes from affecting active leases.

## 3. Comparison Summary

| Feature | Staff Invitation | Tenant Invitation |
| :--- | :--- | :--- |
| **Logic Type** | System Access | System Access + Business Linking |
| **Primary Link** | `org_id` + `properties_scope` | `contract_id` via `ContractMember` |
| **Visibility** | Scoped by Management Role | Scoped by Membership |
| **Self-Service** | None | Limited (e.g. Primary Tenant invites roommates) |

## 4. Special Flow: Roommate Invitations
A primary tenant who is already `APPROVED` in a contract can invite others to join as roommates.
- This uses the same `ContractMember` mechanism.
- The roommate **must already have a system account** before they can be added.
