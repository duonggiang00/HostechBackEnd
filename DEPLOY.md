# Production deploy runbook

Monorepo layout: `backend/` (Laravel API), `frontendV2Hostech/` (Vite SPA). Adjust paths for your server layout.

## 1. Database and code

1. Put the app in maintenance mode if you use it (`php artisan down`).
2. Pull the release tag or branch.
3. Install PHP dependencies: `composer install --no-dev --optimize-autoloader` (or keep dev tools only on build servers).
4. Run migrations: `php artisan migrate --force`.

## 2. RBAC

If any policy module or `getRolePermissions()` matrix changed in the release:

```bash
php artisan rbac:sync
```

Run this **after** migrations so new permission tables/columns exist.

## 3. Caches and config

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Rebuild the SPA (`npm ci && npm run build` in `frontendV2Hostech/`) and deploy the `dist/` assets to your CDN or web root.

After **rotating any secret** (VNPay, mail, Reverb, webhooks), run `php artisan config:cache` again on every node and restart workers. See `backend/docs/architecture/secrets_rotation.md`.

## 4. Environment validation

Before switching traffic or unpausing queues:

```bash
php artisan env:validate --strict
```

In production, run without flags to enforce required variables (see `app/Console/Commands/ValidateEnvironmentCommand.php`).

## 5. Queues and scheduler

Finance EDA listeners (`RecordPaymentLedger`, receipts, etc.) use the `finance` queue when queued. Ensure workers run, for example:

```bash
php artisan queue:work --queue=finance,default --max-jobs=500 --max-time=3600 --memory=512
```

Tune process count and memory with your traffic; see `backend/docs/architecture/queue_operations.md` and `finance_queue_listeners.md` for failed-job handling and retry semantics.

If you use Laravel Scheduler (`routes/console.php`), enable `cron` for `php artisan schedule:run` every minute.

## 6. Backups and object storage

Database backup frequency, retention, encryption, and **quarterly restore drills** are documented in `backend/docs/architecture/backup_restore.md`. Production uploads must use S3-compatible disks—not local `public` storage.

## 7. Post-deploy smoke

1. **Health** — `GET /up` returns 200.
2. **Login** — `POST /api/auth/login` returns `user.permissions` and `token`.
3. **GET /api/auth/me** — 200 for the same token.
4. **Finance read** — e.g. `GET /api/finance/payments` for an Owner test account (org resolved from the user).

Automated equivalent: GitHub Actions workflow `.github/workflows/synthetic-smoke.yml` and Pest `SyntheticSmokeTest`.

## 8. Observability

Structured logging, JSON channel, and RED metrics guidance: `backend/docs/architecture/observability.md`.

## 9. Rollback

Restore the previous release artifact, run `php artisan migrate:rollback` **only** if the release’s migrations were backward-compatible (prefer forward-only migrations in production).

## 10. Architecture docs index


| Topic                          | Path                                                     |
| ------------------------------ | -------------------------------------------------------- |
| Backup / restore               | `backend/docs/architecture/backup_restore.md`            |
| Secrets rotation               | `backend/docs/architecture/secrets_rotation.md`          |
| Queues / Horizon / failed jobs | `backend/docs/architecture/queue_operations.md`          |
| Finance listener retries       | `backend/docs/architecture/finance_queue_listeners.md`   |
| Logs / metrics / tracing       | `backend/docs/architecture/observability.md`             |
| Bootstrap API decision         | `backend/docs/architecture/bootstrap_api_measurement.md` |
| SPA bundle analysis            | `backend/docs/architecture/frontend_bundle_audit.md`     |
| PII / retention                | `backend/docs/architecture/data_inventory_retention.md`  |
| Export / anonymize             | `backend/docs/architecture/export_anonymize_scope.md`    |
| Audit coverage                 | `backend/docs/architecture/audit_log_coverage.md`        |
| ADRs                           | `backend/docs/architecture/adr/README.md`                |
| Ownership                      | `backend/docs/architecture/ownership_matrix.md`          |


