import { test, expect } from '@playwright/test';

/**
 * E2E Gap Investigation: Property Management with data-testid
 * Using storageState from auth.setup.ts to avoid redundant logins.
 */
test.describe('E2E Gap Investigation: Property Management', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to root
    await page.goto('/');
    
    // Wait for the URL to settle into a known functional path
    await page.waitForFunction(() => 
      window.location.pathname.includes('select-property') || 
      window.location.pathname.includes('properties/')
    , { timeout: 10000 });
    
    // If we are on /select-property, click the first property
    if (page.url().includes('select-property')) {
      const propertyCard = page.locator('[class*="cursor-pointer"]').first();
      await propertyCard.waitFor({ state: 'visible', timeout: 10000 });
      await propertyCard.click();
      await page.waitForURL('**/properties/**', { timeout: 15000 });
    }
    
    await page.waitForLoadState('networkidle');
  });

  test('1. Floors page renders (no Coming Soon)', async ({ page }) => {
    // Click sidebar nav item "Tầng và sơ đồ"
    const floorsNavItem = page.locator('[data-testid="sidebar-item-floors"]');
    await floorsNavItem.waitFor({ state: 'visible', timeout: 10000 });
    await floorsNavItem.click();
    
    // Assert FloorsPage renders via data-testid
    const floorsPage = page.locator('[data-testid="floors-page"]');
    await expect(floorsPage).toBeVisible({ timeout: 10000 });
    
    // Verify "Coming Soon" is NOT visible
    await expect(page.getByText('Coming Soon', { exact: true })).not.toBeVisible();
    
    // Verify "Thêm tầng" button is present
    await expect(page.locator('[data-testid="add-floor-btn"]')).toBeVisible();
    
    await page.screenshot({ path: 'tests/e2e/screenshots/01-floors-page.png', fullPage: true });
  });

  test('2. Floor form shows code field (backend parity)', async ({ page }) => {
    // Directly go to floors page to save time
    await page.locator('[data-testid="sidebar-item-floors"]').click();
    
    // Click "Thêm tầng" button
    const addFloorBtn = page.locator('[data-testid="add-floor-btn"]');
    await addFloorBtn.waitFor({ state: 'visible' });
    await addFloorBtn.click();
    
    // Assert floor form appears with code field
    const floorForm = page.locator('[data-testid="floor-form"]');
    await expect(floorForm).toBeVisible({ timeout: 5000 });
    
    await expect(page.locator('[data-testid="floor-code-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="floor-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="floor-number-input"]')).toBeVisible();
    
    // Verify code auto-generation: default should be F01
    await expect(page.locator('[data-testid="floor-code-input"]')).toHaveValue('F01');
    
    await page.screenshot({ path: 'tests/e2e/screenshots/02-floor-form.png', fullPage: true });
  });

  test('3. Rooms page renders (no Coming Soon)', async ({ page }) => {
    // Click sidebar nav item "Phòng"
    const roomsNavItem = page.locator('[data-testid="sidebar-item-rooms"]');
    await roomsNavItem.waitFor({ state: 'visible', timeout: 10000 });
    await roomsNavItem.click();
    
    // Assert RoomListPage renders via data-testid
    const roomsPage = page.locator('[data-testid="rooms-page"]');
    await expect(roomsPage).toBeVisible({ timeout: 10000 });
    
    // Verify no Coming Soon placeholder
    await expect(page.getByText('Coming Soon', { exact: true })).not.toBeVisible();
    
    await page.screenshot({ path: 'tests/e2e/screenshots/03-rooms-page.png', fullPage: true });
  });

  test('4. Services page renders via Cài đặt > Dịch vụ & Bảng giá', async ({ page }) => {
    // Click "Cài đặt tòa nhà" dropdown to expand children
    const settingsNavItem = page.locator('[data-testid="sidebar-item-settings"]');
    await settingsNavItem.waitFor({ state: 'visible', timeout: 10000 });
    await settingsNavItem.click();
    
    // Click "Dịch vụ & Bảng giá" child item
    const servicesNavItem = page.locator('[data-testid="sidebar-item-services"]');
    await servicesNavItem.waitFor({ state: 'visible', timeout: 10000 });
    await servicesNavItem.click({ force: true });
    
    // Assert ServiceListPage renders via data-testid
    const servicesPage = page.locator('[data-testid="services-page"]');
    await expect(servicesPage).toBeVisible({ timeout: 10000 });
    
    // Verify page title
    await expect(page.getByText('Dịch vụ & Bảng giá')).toBeVisible();
    
    await page.screenshot({ path: 'tests/e2e/screenshots/04-services-page.png', fullPage: true });
  });

  test('5. Templates page is accessible', async ({ page }) => {
    // Click sidebar nav item "Mẫu và cấu hình"
    const templatesNavItem = page.locator('[data-testid="sidebar-item-templates"]');
    await templatesNavItem.waitFor({ state: 'visible', timeout: 10000 });
    await templatesNavItem.click();
    
    // Verify the templates page loaded (no Coming Soon)
    await expect(page.getByText('Coming Soon', { exact: true })).not.toBeVisible();
    
    await page.screenshot({ path: 'tests/e2e/screenshots/05-templates-page.png', fullPage: true });
  });
});
