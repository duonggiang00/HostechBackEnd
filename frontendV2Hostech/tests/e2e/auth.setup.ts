import { test as setup, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.resolve('playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/login');
  
  // Step 1: Identifier
  await page.fill('input[type="text"]', 'nam-thanh_manager_1@example.com');
  await page.click('button:has-text("Continue")');
  
  // Step 2: Password
  // Wait for the password input to be visible due to the animation
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: 'visible' });
  await passwordInput.fill('12345678');
  
  // Submit
  await page.click('button:has-text("Log In Securely")');
  
  // Wait until the page resolves to the root dashboard
  await page.waitForURL('**/');
  // Wait for network idle to ensure everything loaded
  await page.waitForLoadState('networkidle');

  // Save storage state to a file
  await page.context().storageState({ path: authFile });
});
