import { test, expect } from '@playwright/test';

test('reproduce login redirection issue', async ({ page }) => {
  await page.goto('/login');
  
  // Enter email/identifier
  await page.fill('input[placeholder*="Email"]', 'nam-thanh_manager_1@example.com');
  await page.keyboard.press('Enter');
  
  // Wait for password step
  await page.waitForSelector('input[type="password"]');
  
  // Enter password
  await page.fill('input[type="password"]', '12345678');
  await page.keyboard.press('Enter');
  
  // Wait for navigation
  await page.waitForURL('**/*');
  console.log('Current URL after login:', page.url());
  
  // Capture screenshot
  await page.screenshot({ path: 'login_result.png' });
  
  // Check user state in localStorage
  const authStorage = await page.evaluate(() => {
    const data = localStorage.getItem('hostech-auth-storage');
    return data ? JSON.parse(data) : null;
  });
  
  console.log('Auth Storage User:', JSON.stringify(authStorage?.state?.user, null, 2));
  
  if (page.url().includes('org-select')) {
    console.log('User was redirected to org-select as reported.');
    
    // Check if user has properties
    const properties = authStorage?.state?.user?.properties || [];
    console.log(`User has ${properties.length} properties.`);
    
    if (properties.length === 1) {
      console.log('User has ONLY ONE property but was still sent to org-select.');
    }
  }
});
