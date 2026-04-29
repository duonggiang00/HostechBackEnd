# PII inventory and retention (baseline)

> Legal retention for finance varies by jurisdiction; **legal review** before shortening finance-related retention.

## PII-bearing areas (non-exhaustive)

| Area | Examples | Typical content |
|------|----------|------------------|
| `users` | Core account | Name, email, phone, password hash |
| `contract_members` | Tenancy | Full name, phone, identity numbers |
| Payments / invoices | Finance | Amounts, references, payer linkage |
| Meter readings | Utility | Usage tied to unit / tenant |
| Tickets | Support | Free-text descriptions, attachments |
| Media (Spatie) | Receipts, PDFs | Binary proofs |

## Retention defaults (starting policy)

| Data class | Application logs | DB / business data | Audit / activity |
|------------|------------------|--------------------|------------------|
| Web / API logs | 30–90 days | n/a | Ship JSON logs; scrub query strings with tokens |
| Operational DB | n/a | Life of contract + statutory hold | n/a |
| Finance audit | n/a | Align with tax law (often multi-year) | Spatie activity on high-value models |

## Logs

- Prefer structured JSON (`observability.md`).
- Avoid logging national IDs or full card numbers.

## Next steps

- Scoped export / erasure design: `export_anonymize_scope.md`.
