# Database backup, object storage, and restore drills

## Goals

- Recover quickly from operator error, bad deploy, or infrastructure loss.
- Prove restores work on a **schedule**, not only when disaster strikes.

## Database backups

| Item | Recommendation |
|------|------------------|
| Frequency | At least daily full backup; enable binlog / WAL-style incremental if your engine supports it (MySQL: enable binary logging; point-in-time recovery). |
| Retention | Keep 7–30 daily copies; retain month-end snapshots longer (e.g. 12 months) for finance disputes. |
| Encryption | Encrypt backups at rest (disk encryption, KMS-managed keys, or encrypted object storage). |
| Off-site | Store at least one copy in a different region/account from the primary DB. |
| Access | Restrict backup credentials to break-glass roles; audit downloads. |

### Restore test (quarterly)

1. Provision an isolated **staging clone** (empty app + restored DB snapshot).
2. Run `php artisan migrate --force` only if the snapshot is older than the latest migration set (prefer restoring to a throwaway instance without mutating production migration history).
3. Smoke-test: `GET /up`, login, `GET /api/finance/payments` (see DEPLOY.md and synthetic smoke tests).
4. Record date, engineer, snapshot ID, and any issues in your change log or ticket system.

## Object storage (uploads / receipts)

Production must use **S3-compatible** private storage for tenant receipts, PDFs, and media—not the `public` local disk.

| Check | Detail |
|-------|--------|
| `FILESYSTEM_DISK` | Set to `s3` (or your custom disk pointing at MinIO / R2 / S3). |
| `AWS_*` or vendor vars | Present in production `.env`; never commit secrets. |
| Signed URLs | Prefer time-limited signed URLs for downloads (see finance / media controllers). |
| Dev-only | `local` / `public` disks are acceptable only on developer machines. |

## Related

- Production runbook: `DEPLOY.md` (root).
- Secrets rotation: `secrets_rotation.md`.
