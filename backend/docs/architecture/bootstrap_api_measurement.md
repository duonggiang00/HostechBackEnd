# `/api/bootstrap` decision (SPA measurement)

## Hypothesis

A single `GET /api/bootstrap` could reduce post-login round-trips by bundling `UserResource`, small org/property flags, and unread counters.

## Measurement plan (frontend)

1. **Instrument the SPA** after successful login (same session as production-like traffic):
   - Count HTTP calls and total wall time until the shell is “ready” (dashboard or default landing).
   - Specifically count `GET /api/auth/me` and dependent calls (orgs, properties, permissions sync if any).
2. **Aggregate:** median and p95 over at least 100 sessions (staging with realistic seed data).
3. **Threshold:** Agree with product on a target (example: median &gt; 800 ms or more than 4 sequential API round-trips before first paint).

## Decision

| Outcome | Action |
|---------|--------|
| Threshold exceeded | Write an ADR; specify `GET /api/bootstrap` returning `UserResource` + minimal flags in **one** response; version the contract. |
| Threshold not exceeded | **Defer** dedicated bootstrap endpoint; keep optimizing critical queries and bundle splits (`p8-bundle-audit`). |

## Contract sketch (if built)

- **Route:** `GET /api/bootstrap` (Sanctum).
- **Payload:** `user` (same shape as `/api/auth/me`), optional `unread_notifications_count`, `active_org_id`—keep small to avoid N+1 explosion.
- **Caching:** short TTL client cache keyed by user + org.

This document satisfies the “measure before building” gate from the roadmap.
