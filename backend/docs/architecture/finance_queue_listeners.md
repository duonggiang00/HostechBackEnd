# Finance queue listeners: retries and idempotency

Finance flows use domain events and queued listeners (`app/Listeners/Finance/`). The queue is **at-least-once**: a worker crash after side effects but before ACK can cause a **duplicate delivery**. Each listener must be safe to retry or must fail in a way that forces **manual replay**.

| Listener | Event | Safe to retry? | Notes |
|----------|--------|----------------|-------|
| `RecordPaymentLedger` | `PaymentSuccessfullyVerified` | **Must be idempotent** | `LedgerService::recordPayment` must not double-post; verify unique constraints / upsert patterns. |
| `GeneratePaymentReceipt` | `PaymentSuccessfullyVerified` | **Yes** (intended) | `ReceiptService::generateForPayment` uses idempotent `updateOrCreate`-style persistence. |
| `BroadcastInvoicePaidAfterPaymentVerified` | (same family) | **Mostly yes** | Broadcasting twice may duplicate realtime messages; acceptable for many UIs; tighten if clients cannot dedupe. |
| `LogPaymentActivity` | Finance events | **Yes** | Prefer append-only logs. |
| `NotifyTenantPaymentReceived` | Finance events | **Risk** | Tenants may get duplicate notifications; consider idempotency keys per `payment_id` + channel. |
| `ReversePaymentLedger` | `PaymentVoided` | **Must be idempotent** | Same as ledger record: reversals must not double-apply. |

## Manual replay

If a job fails after partial effects:

1. Inspect logs (`payment_id`, stack trace).
2. Verify DB state (ledger rows, receipts).
3. Use `php artisan queue:retry {id}` only when the listener is listed as safe, or fix data and dispatch a compensating admin action.

## Operational doc

Keep worker count and memory limits next to the queue section in `DEPLOY.md` when you change defaults.
