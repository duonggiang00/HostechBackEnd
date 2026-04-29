# Audit log coverage (payments, invoices, contracts)

## Mechanism

High-value Eloquent models use `App\Traits\SystemLoggable` (Spatie Activity Log) with `tapActivity` to attach `org_id`. Mutations persist to the activity log when attributes change (`logOnlyDirty`).

## Covered models (examples)

| Domain | Model | Notes |
|--------|-------|-------|
| Finance | `Payment` | Status transitions, allocations |
| Invoice | `Invoice` | Status / amounts |
| Contract | `Contract`, `ContractMember` | Lifecycle and membership |

## HTTP flows

| Flow | Logging |
|------|---------|
| Payment verification approve | `PaymentService::approvePending` updates payment → activity |
| Payment verification reject | Controller updates payment + invoices → activity on touched models |
| Direct payment create/void | Service layer mutates `Payment` |

## Causer on finance activity log

`LogPaymentActivity` attaches `causedBy` where possible: approved payments use `approved_by_user_id` / `received_by_user_id`; voided payments infer the last `PaymentStatusHistory.changed_by_user_id` for the payment.


## Gaps and mitigations

- **Duplicate notifications** from retried queue jobs are not fully deduplicated; see `finance_queue_listeners.md`.
- **Non-model changes** (pure cache clears) are not in activity log—acceptable if operational metrics cover them.

## Review cadence

Quarterly: sample activity for `Payment` and `Invoice` status changes and compare to finance reconciliation tickets.
