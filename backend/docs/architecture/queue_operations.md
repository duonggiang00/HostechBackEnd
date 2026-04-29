# Queues: workers, Horizon, and failed jobs

Finance EDA listeners (`RecordPaymentLedger`, `GeneratePaymentReceipt`, etc.) use the `finance` queue when queued. See `DEPLOY.md` for the basic worker command.

## Worker sizing (starting point)

| Setting | Suggested starting value | Notes |
|---------|---------------------------|--------|
| Processes | 1–2 per queue per node | Increase when `finance` depth grows; watch CPU and DB contention. |
| `--max-jobs` | 500–1000 | Recycle workers to mitigate memory leaks. |
| `--max-time` | 3600 | Align with deploy cadence. |
| `--memory` | 256–512 (MB) | Raise if PDF generation spikes RSS. |

Example:

```bash
php artisan queue:work redis --queue=finance,default --sleep=1 --tries=3 --max-jobs=500 --max-time=3600 --memory=512
```

## Laravel Horizon (optional)

If you standardize on **Redis** for queues, install [Laravel Horizon](https://laravel.com/docs/horizon) for:

- Dashboard of throughput, failures, and wait time.
- Supervisor-friendly process definitions.

Horizon is **not** required for correctness; `queue:work` is sufficient at small scale.

## Failed jobs and alerting

1. **Inspection:** `php artisan queue:failed` — list failures; `queue:retry {id}` for safe replays (see `finance_queue_listeners.md`).
2. **Threshold alerting:** Alert if `failed_jobs` count increases sharply in 15 minutes, or if queue latency (oldest job age) exceeds SLO.
3. **Idempotency:** Only retry listeners documented as safe for at-least-once delivery.

## Related

- Listener retry semantics: `finance_queue_listeners.md`.
- Deploy smoke: `DEPLOY.md`.
