import { test, expect } from '@playwright/test';

/**
 * Tenant: `RootRedirect` đưa về `/app/dashboard` (storage từ `E2E_TENANT_EMAIL`).
 */
test('tenant lands on resident app shell', async ({ page }) => {
  await page.goto('/');

  await page.waitForURL((url) => url.pathname.startsWith('/app'), { timeout: 25_000 });

  await expect(page).toHaveURL(/\/app\//);
});
