# Observability: logs, metrics, tracing

## Structured logs

- **Request ID:** `AssignRequestId` middleware assigns `request_id` (from `X-Request-Id` or a UUID) and exposes it on the response as `X-Request-Id`.
- **Authenticated context:** `EnrichApiLogContext` adds `user_id`, `route`, and `http_method` for Sanctum-protected routes.
- **JSON channel:** Configure `LOG_STACK` to include the `json` channel (see `config/logging.php`) so each line is JSON-friendly for Loki / CloudWatch / Datadog. Example `.env`:

  ```env
  LOG_STACK=json,single
  ```

- **PII:** Do not log request bodies for auth or payment endpoints; prefer IDs and coarse statuses.

## Metrics (RED)

Track at minimum:

| Signal | Examples |
|--------|-----------|
| Rate | Requests per second per route (`route` label). |
| Errors | HTTP 5xx rate; `POST /api/auth/login` 422 rate (credential failures vs bugs). |
| Duration | p50/p95 latency for `POST /api/finance/payments` and `GET /api/finance/payments`. |

Implementation options: cloud vendor APM, Prometheus exporter, or Laravel Pulse for slow queries and queues.

## Tracing (optional)

For slow finance and contract flows, add OpenTelemetry PHP or vendor APM with **sampling** in production (e.g. 1–5%) to control cost.

## Synthetic checks

Automated smoke: GitHub Actions workflow `synthetic-smoke.yml` and Pest test `SyntheticSmokeTest` (health, login, finance read).
