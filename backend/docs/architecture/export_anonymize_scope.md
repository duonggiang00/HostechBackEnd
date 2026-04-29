# Export and anonymization scope (churn / GDPR-style)

> **Legal review required** before offering erasure in regulated markets. This document is engineering scaffolding only.

## Roles

| Actor | Export scope (proposal) |
|-------|---------------------------|
| Organization owner | Org-level ledger extracts, invoices, contracts for their org |
| Tenant | Personal data tied to their membership and tickets they opened |
| Platform admin | Break-glass exports per policy; fully audited |

## Erasure vs anonymize

| Approach | When |
|----------|------|
| **Soft delete** | User self-service “close account”; reversable cooling-off period |
| **Anonymize** | After legal hold expires; replace PII with irreversible placeholders while retaining numeric aggregates if required |
| **Hard delete** | Only when law and finance sign off |

## Minimum viable export

- JSON or ZIP bundle: user profile, contract member rows, ticket list metadata (not necessarily all attachments).
- Integrity: checksum file; signed download link with TTL.

## Implementation gate

Do not ship automated erasure without:

1. Legal sign-off on finance retention.
2. Idempotent job to process requests and emit audit events.
3. Runbook for partial failures (object storage orphaned keys).
