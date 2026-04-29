# Architecture Decision Records (ADR)

Lightweight records of significant technical decisions. Store new ADRs in this directory as `NNNN-title.md` using the template below.

## Template

```markdown
# ADR NNNN: Title

## Status

Proposed | Accepted | Superseded by ADR-XXXX

## Context

What problem or forces led to this decision?

## Decision

What did we choose?

## Consequences

Positive and negative trade-offs, follow-up work.

## Links

PRs, tickets, docs.
```

## Suggested first ADRs

1. **Auth contract** — Sanctum + Fortify JSON login; MFA challenge flow.
2. **Ledger double-entry** — Event-driven `RecordPaymentLedger` and reversal semantics.
3. **Multi-tenant org scope** — `org_id`, headers for Admin, property manager scoping.
