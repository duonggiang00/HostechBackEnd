# Module ownership matrix (one page)

| Area | Primary owner | Notes |
|------|----------------|-------|
| Finance EDA / ledger | Backend platform + finance domain | Listeners under `app/Listeners/Finance/` |
| RBAC / policies | Backend platform | Run `php artisan rbac:sync` after policy changes |
| CI / quality gates | Platform | `.github/workflows/ci.yml`, Pint, PHPStan, audits |
| Frontend SPA release | Frontend team | `frontendV2Hostech/`, Vite build |
| Deploy / infra | Operations | `DEPLOY.md`, workers, backups |
| Observability | Platform + SRE | `observability.md`, log shipping |

Update this table when staffing changes; link from the repository root `README.md` if present.
