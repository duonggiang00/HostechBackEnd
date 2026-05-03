import type { Page } from '@playwright/test';

/** Mật khẩu seed chung (OrgSeeder / tài khoản test). */
export const E2E_DEFAULT_PASSWORD = '12345678';

export const E2E_MANAGER_EMAIL = 'test_manager_1@example.com';
export const E2E_STAFF_EMAIL = 'test_staff_1@example.com';

/**
 * Đăng nhập qua `/login` (cùng form cho mọi role).
 * UI: placeholder Tài khoản / Mật khẩu, nút Đăng nhập.
 */
export async function loginAs(page: Page, email: string, password: string = E2E_DEFAULT_PASSWORD): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder(/tài khoản/i).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForURL(
    (url) =>
      url.pathname.includes('/select-property') ||
      url.pathname === '/' ||
      url.pathname.startsWith('/properties') ||
      url.pathname.startsWith('/app') ||
      url.pathname.startsWith('/org'),
    { timeout: 30_000 },
  );
  await page.waitForLoadState('networkidle');
}
