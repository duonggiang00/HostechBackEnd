import { test as setup, expect } from '@playwright/test';


const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/login');
  
  // Fill both identity and password
  await page.fill('input[placeholder*="Email"]', 'test_manager_1@example.com');
  await page.fill('input[placeholder*="Mật khẩu"]', '12345678');
  
  // Submit
  await page.click('button:has-text("ĐĂNG NHẬP")');
  
  // Wait until the page resolves to either select-property or dashboard
  await page.waitForURL(url => url.pathname.includes('select-property') || url.pathname === '/', { timeout: 15000 });
  
  // Wait for network idle to ensure everything loaded
  await page.waitForLoadState('networkidle');

  // Save storage state to a file
  await page.context().storageState({ path: authFile });
});
