import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:3000';
const PROPERTY_ID = '4565eb71-718a-4441-8dcd-bb2e9de6fd3f'; // Valid property for manager nam-thanh

test.describe('V2 Operations Phase 2: Dashboard & Metering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to property dashboard
    await page.goto(`${BASE_URL}/properties/${PROPERTY_ID}/dashboard`);
    // Wait for content to load
    await page.waitForSelector('[data-testid="stat-rooms"]');
  });

  test('should display dashboard stats correctly', async ({ page }) => {
    // Check main stats exist
    await expect(page.getByTestId('stat-tenants')).toBeVisible();
    await expect(page.getByTestId('stat-rooms')).toBeVisible();
    await expect(page.getByTestId('stat-unpaid')).toBeVisible();
    await expect(page.getByTestId('stat-revenue')).toBeVisible();
    
    // Check billing button exists
    await expect(page.getByTestId('generate-billing-btn')).toBeVisible();
  });

  test('should navigate to quick reading and calculate consumption', async ({ page }) => {
    // Navigate to Quick Reading
    await page.goto(`${BASE_URL}/properties/${PROPERTY_ID}/meters/quick-reading`);
    
    // Wait for meters to load
    await page.waitForSelector('[data-testid^="meter-reading-input-"]');
    
    // Get the first meter input
    const firstInput = page.locator('[data-testid^="meter-reading-input-"]').first();
    const meterId = (await firstInput.getAttribute('data-testid'))?.replace('meter-reading-input-', '');
    
    // Get previous value (old reading)
    // The old reading is in the same row, we need to find it.
    // Based on our code: <p className="font-semibold text-slate-700 dark:text-slate-300">{prevValue.toLocaleString('vi-VN')}...</p>
    // It doesn't have a test-id yet, but let's assume we can find it by text or position.
    // Or we just type a value and see if consumption updates.
    
    await firstInput.fill('1000');
    
    // Check if progress updates
    const progressText = await page.getByTestId('reading-progress-text').textContent();
    expect(progressText).toContain('1 /');
    
    // Check consumption value
    const consumption = page.getByTestId(`consumption-value-${meterId}`);
    await expect(consumption).not.toBeEmpty();
    
    // Test date pickers
    await expect(page.getByTestId('reading-period-start')).toBeVisible();
    await expect(page.getByTestId('reading-period-end')).toBeVisible();
  });

  test('should show validation error toast if submission has smaller value', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties/${PROPERTY_ID}/meters/quick-reading`);
    await page.waitForSelector('[data-testid^="meter-reading-input-"]');
    
    // Get the first meter
    const firstInput = page.locator('[data-testid^="meter-reading-input-"]').first();
    const meterId = (await firstInput.getAttribute('data-testid'))?.replace('meter-reading-input-', '');
    
    // Get old reading
    const oldReadingText = await page.getByTestId(`prev-reading-value-${meterId}`).textContent();
    const oldValue = parseFloat(oldReadingText?.replace(/\./g, '').replace(/,/g, '.') || '0');
    
    if (oldValue > 0) {
      await firstInput.fill((oldValue - 1).toString());
      
      // Click Save
      await page.locator('button:has-text("Lưu ngay")').click();
      
      // Check for toast error message (assuming react-hot-toast)
      // "Chỉ số mới của đồng hồ phòng ... không thể nhỏ hơn chỉ số cũ"
      await expect(page.locator('text=không thể nhỏ hơn chỉ số cũ')).toBeVisible();
    }
  });

  test('should successfully chốt số (close readings) in bulk', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties/${PROPERTY_ID}/meters/quick-reading`);
    await page.waitForSelector('[data-testid^="meter-reading-input-"]');
    
    const firstInput = page.locator('[data-testid^="meter-reading-input-"]').first();
    const meterId = (await firstInput.getAttribute('data-testid'))?.replace('meter-reading-input-', '');
    const oldReadingText = await page.getByTestId(`prev-reading-value-${meterId}`).textContent();
    const oldValue = parseFloat(oldReadingText?.replace(/\./g, '').replace(/,/g, '.') || '0');
    
    // Fill with a valid higher value
    await firstInput.fill((oldValue + 10).toString());
    
    // Click Save
    await page.locator('button:has-text("Lưu ngay")').click();
    
    // Check for success toast
    await expect(page.locator('text=Đã chốt thành công')).toBeVisible();
    
    // Should navigate back to list
    await expect(page).toHaveURL(new RegExp(`/properties/${PROPERTY_ID}/meters$`));
  });

  test('should validate individual reading update in MeterDetailPage', async ({ page }) => {
    // Navigate to a meter detail page
    // We need a valid meter ID, let's get it from the list
    await page.goto(`${BASE_URL}/properties/${PROPERTY_ID}/meters`);
    await page.waitForSelector('text=STT');
    
    // Click on the first "Xem chi tiết" (View Details) button
    await page.getByTitle('Xem chi tiết').first().click();
    
    // Check if we are on the detail page
    await expect(page).toHaveURL(new RegExp(`/properties/${PROPERTY_ID}/meters/[^/]+$`));
    
    // Click "Sửa" (Edit) on the first reading in the table
    // Assuming there is at least one reading
    const editButton = page.locator('button:has-text("Sửa")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Get the current value
      const readingInput = page.locator('input[name="reading_value"]');
      const currentValue = parseInt(await readingInput.inputValue());
      
      if (currentValue > 0) {
        // Try to set a lower value
        await readingInput.fill((currentValue - 1).toString());
        await page.locator('button:has-text("Cập nhật")').click();
        
        // Should show error
        await expect(page.locator('text=không thể nhỏ hơn chỉ số cũ')).toBeVisible();
      }
    }
  });
});
