import { test, expect } from '@playwright/test';
import { resolvePropertyId } from './helpers/propertyScope';

test.describe('Manager (test_manager_1)', () => {
  test('document title và shell sau đăng nhập', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(
      (url) =>
        url.pathname.includes('/properties/') ||
        url.pathname === '/select-property' ||
        url.pathname.startsWith('/org'),
      { timeout: 20_000 },
    );
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Hostech V2/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('trang biên lai: PermissionGate hydrate (viewAny Payment)', async ({ page }) => {
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

    await expect(page.getByTestId('rbac-permission-viewAny-payment')).toBeAttached({ timeout: 20_000 });
  });
});
