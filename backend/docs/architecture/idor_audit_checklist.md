# IDOR audit checklist (tenant / multi-org)

Use this when adding or changing routes that accept a UUID in the path or body.

## Principles

1. **Never trust the ID alone.** Resolve the model, then enforce **org scope** (`org_id`, `TenantManager`, `X-Org-Id`) and **policy** (`$this->authorize`).
2. **Tenant portal (`/api/app/*`).** Treat as hostile: users only see rows tied to **their membership** or **payer** context, not every row in the org.
3. **Opaque responses.** Returning `404` when a record exists but is out of scope is acceptable (avoids leaking IDs). Returning `403` after `authorize()` is also valid. Pick one style per resource and keep it consistent.

## Route groups to re-verify

| Area | Prefix / pattern | Extra scope beyond policy |
|------|------------------|----------------------------|
| Tenant payments | `POST /api/app/payments/submit-proof` | Contract / invoice ownership |
| Tenant meters | `GET /api/app/meters`, meter submit | Room / contract membership |
| Contracts | `/api/contracts/{id}` | `ContractService::find` + membership for tenants |
| Finance | `/api/finance/payments/{id}` | `payer_user_id` for tenants; property managers for staff |

## Automated tests

- `tests/Feature/TenantAppIdorTest.php` — cross-org tenant cannot read another org’s contract (expects `404` with current service scoping).
- `tests/Feature/PolicyModuleRbacMatrixTest.php` — sample RBAC matrix for invoices / payments / properties / rooms.

## Manual smoke (staging)

1. Two tenants in different orgs: swap contract UUIDs in the URL bar / API client — must not expose the other contract’s payload.
2. Manager removed from property: must lose access to that property’s invoices and payments.
