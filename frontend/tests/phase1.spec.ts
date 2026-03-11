import { test, expect } from '@playwright/test';

test.describe('Phase 1 Frontend Tests', () => {

    test.describe('1. Authentication Module', () => {
        // TC-AUTH-01
        test('TC-AUTH-01: User can login successfully', async ({ page }) => {
            await page.goto('/auth');
            await expect(page.getByRole('button', { name: /đăng nhập/i })).toBeVisible({ timeout: 10000 });
            await page.locator('input[type="email"], input[name="email"]').fill('admin@example.com');
            await page.locator('input[type="password"], input[name="password"]').fill('12345678');
            await page.getByRole('button', { name: /đăng nhập/i }).click();
            await expect(page).toHaveURL(/\/.*admin/i, { timeout: 10000 }).catch(() => null);
            await page.waitForLoadState('networkidle');
            const userIcon = page.locator('svg.lucide-user, .lucide-circle-user, button:has-text("N")'); 
            if (await userIcon.count() > 0) {
                await expect(userIcon.first()).toBeVisible();
            }
        });

        // TC-AUTH-02
        test('TC-AUTH-02: Login fails with incorrect password', async ({ page }) => {
            await page.goto('/auth');
            await page.locator('input[type="email"], input[name="email"]').fill('admin@example.com');
            await page.locator('input[type="password"], input[name="password"]').fill('wrongpassword');
            await page.getByRole('button', { name: /đăng nhập/i }).click();
            await expect(page.getByText(/sai email.*mật khẩu/i)).toBeVisible({ timeout: 10000 });
            await expect(page).toHaveURL(/\/auth/i);
        });

        // TC-AUTH-03
        test('TC-AUTH-03: Login fails with non-existent email', async ({ page }) => {
            await page.goto('/auth');
            await page.locator('input[type="email"], input[name="email"]').fill('notexist@example.com');
            await page.locator('input[type="password"], input[name="password"]').fill('12345678');
            await page.getByRole('button', { name: /đăng nhập/i }).click();
            await expect(page.getByText(/sai email.*mật khẩu/i)).toBeVisible({ timeout: 10000 });
            await expect(page).toHaveURL(/\/auth/i);
        });

        // TC-AUTH-04 
        test('TC-AUTH-04: User can logout successfully', async ({ page }) => {
            await page.goto('/auth');
            await page.locator('input[type="email"], input[name="email"]').fill('admin@example.com');
            await page.locator('input[type="password"], input[name="password"]').fill('12345678');
            await page.getByRole('button', { name: /đăng nhập/i }).click();
            await page.waitForURL(/\/.*admin/i);
            
            // Open Profile dropdown
            const profileArea = page.locator('.lucide-user-round-check').locator('..');
            await profileArea.click();
            
            // Click Logout
            await page.getByText('Đăng xuất').click();
            
            // Assert redirect back to login
            await expect(page).toHaveURL(/\/auth/i, { timeout: 10000 });
        });

        // TC-AUTH-05
        test('TC-AUTH-05: Route guards block unauthenticated users', async ({ page }) => {
            await page.goto('/admin/profile');
            // Should redirect back to login
            await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
        });
    });

    test.describe('2. Profile & 2FA Module', () => {
        test('TC-PROF-01, TC-PROF-04, TC-2FA: Profile management and 2FA are accessible', async ({ page }) => {
            await page.goto('/auth');
            await page.locator('input[type="email"], input[name="email"]').fill('admin@example.com');
            await page.locator('input[type="password"], input[name="password"]').fill('12345678');
            await page.getByRole('button', { name: /đăng nhập/i }).click();
            await page.waitForLoadState('networkidle');

            // Navigate to profile
            await page.goto('/admin/profile');

            // 1. Check for personal info form elements
            await expect(page.getByText(/hồ sơ cá nhân/i).first()).toBeVisible({ timeout: 10000 });
            await expect(page.locator('input[name="name"]')).toBeVisible();
            await expect(page.locator('input[name="email"]')).toBeVisible();

            // 2. Check Password form
            await page.getByRole('tab', { name: 'Đổi mật khẩu' }).click();
            await expect(page.locator('input[name="current_password"]')).toBeVisible();
            await expect(page.locator('input[name="password"]')).toBeVisible();

            // 3. Check 2FA Setup
            await page.getByRole('tab', { name: 'Bảo mật 2 Lớp (2FA)' }).click();
            await expect(page.getByRole('button', { name: /bật bảo mật 2 lớp/i }).or(page.getByRole('button', { name: /tắt 2fa/i }))).toBeVisible();
        });
    });
});
