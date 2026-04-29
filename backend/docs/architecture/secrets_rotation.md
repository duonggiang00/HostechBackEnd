# Secrets rotation checklist

Rotate credentials on a cadence (e.g. annually, or immediately after suspected leak). After each rotation:

1. Update the value in your secrets store (`.env` on server, vault, or PaaS env UI)—**never** commit to git.
2. Run `php artisan config:cache` on every app node (see `DEPLOY.md`).
3. Restart queue workers and long-lived PHP workers (Octane, Horizon) so they pick up new config.
4. Smoke-test affected flows (login, mail, VNPay sandbox, webhooks).

## Application secrets

| Secret / area | Notes |
|---------------|--------|
| `APP_KEY` | Rotation invalidates encrypted data and sessions; plan a maintenance window and re-encrypt if you use Laravel encryption heavily. |
| Sanctum / SPA | If you rotate stateful domains or token policies, clear old tokens and retest SPA login. |
| Mail (`MAIL_PASSWORD`, API keys) | Send a test message after rotation. |
| VNPay (`VNPAY_HASH_SECRET`, `VNPAY_TMN_CODE`) | Rotate in VNPay merchant portal; update IPN URL whitelist if endpoints change. |
| Reverb / Pusher (`REVERB_APP_SECRET`, `PUSHER_*`) | Clients may need hard refresh; rotate during low traffic. |
| Third-party webhooks | Re-sign test payloads; update HMAC secrets in partner dashboards. |

## Validation

Run:

```bash
php artisan env:validate
```

In production this fails on missing critical variables. For staging parity checks:

```bash
php artisan env:validate --strict
```

See `ValidateEnvironmentCommand` in `app/Console/Commands`.
