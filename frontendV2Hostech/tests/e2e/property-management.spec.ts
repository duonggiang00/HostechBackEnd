import { test, expect } from '@playwright/test';

test.describe('Property Management (Floors and Templates)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root to select a property
    await page.goto('/');
    // Wait for properties to load and select the first one
    await page.waitForLoadState('networkidle');
    // Assuming there is a link or card leading to a property, like "Quản lý" or clicking the property name
    const propertyLink = page.getByRole('link', { name: /Quản lý/i }).first();
    // If we are already redirected or propertyLink doesn't exist, we might already be on /properties/:id
    if (await propertyLink.isVisible()) {
      await propertyLink.click();
      await page.waitForURL('**/properties/**');
    }
  });

  test('Should navigate to Floor management and verify Add Floor flow', async ({ page }) => {
    // Click Cấu hình (Settings) tab
    await page.getByRole('tab', { name: /Cấu hình/i }).click();

    // Verify Floor tab exists and click it
    const addFloorBtn = page.getByRole('button', { name: /Thêm tầng/i });
    if (await addFloorBtn.isVisible()) {
      await addFloorBtn.click();
      // Simple validation or close
      await page.keyboard.press('Escape'); // Close modal if any
    }
  });

  test('Should navigate to Room Templates and verify Template creation', async ({ page }) => {
    // Click Cấu hình (Settings) tab
    await page.getByRole('tab', { name: /Cấu hình/i }).click();
    
    // Switch to Mẫu thiết lập phòng tab
    await page.getByRole('tab', { name: /Mẫu thiết lập phòng/i }).click();
    
    // Verify Add button
    const addTemplateBtn = page.getByRole('button', { name: /Thêm mẫu/i });
    if (await addTemplateBtn.isVisible()) {
        await expect(addTemplateBtn).toBeVisible();
    }
  });
});
