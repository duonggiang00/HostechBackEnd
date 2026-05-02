import { test, expect } from '@playwright/test';
import { resolvePropertyId } from './helpers/propertyScope';

/**
 * Staff (`test_staff_1@example.com`): vào màn xét duyệt thanh toán tenant (menu đã mở cho Staff).
 * Phụ thuộc `playwright/.auth/staff.json` từ `auth.setup.ts`.
 */
test('staff reaches payment verification page', async ({ page }) => {
  await page.goto('/');

  await page.waitForURL(
    (url) =>
      url.pathname.includes('/properties/') ||
      url.pathname === '/select-property' ||
      url.pathname === '/',
    { timeout: 20_000 },
  );

  const propertyId = await resolvePropertyId(page);

  await page.goto(`/properties/${propertyId}/billing/payment-verifications`);
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Xét duyệt thanh toán' })).toBeVisible({ timeout: 20_000 });
});

test('staff reaches receipts (biên lai) list page', async ({ page }) => {
  await page.goto('/');
  await page.waitForURL(
    (url) =>
      url.pathname.includes('/properties/') ||
      url.pathname === '/select-property' ||
      url.pathname === '/',
    { timeout: 20_000 },
  );
  const propertyId = await resolvePropertyId(page);
  await page.goto(`/properties/${propertyId}/finance/payments`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Biên lai' })).toBeVisible({ timeout: 20_000 });
});
