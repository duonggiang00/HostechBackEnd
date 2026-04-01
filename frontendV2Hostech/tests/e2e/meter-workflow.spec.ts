import { test, expect } from '@playwright/test';

// Configuration
const PROPERTY_ID = '4565eb71-718a-4441-8dcd-bb2e9de6fd3f';

test.describe('Meter Reading Workflow: DRAFT → SUBMITTED → APPROVED/REJECTED', () => {

  test.describe('1. Create DRAFT Reading', () => {
    test('should create a new reading in DRAFT status from MeterDetailPage', async ({ page }) => {
      // Navigate to meters list
      await page.goto(`/properties/${PROPERTY_ID}/meters`);
      await page.waitForLoadState('networkidle');

      // Click on the first meter to go to detail page
      const viewDetailBtn = page.locator('button[title="Xem chi tiết"]').first();
      await viewDetailBtn.waitFor({ state: 'visible', timeout: 10000 });
      await viewDetailBtn.click();

      // Wait for detail page to load
      await page.waitForURL(/\/meters\/[^/]+$/);
      await expect(page.getByTestId('meter-detail-title')).toBeVisible();
      await expect(page.getByTestId('readings-history-title')).toBeVisible();

      // Click "Thêm chốt số mới"
      await page.getByTestId('btn-add-reading').click();

      // Wait for the add form
      await expect(page.getByTestId('add-reading-form-title')).toBeVisible();

      // Fill in the reading value
      const readingInput = page.getByTestId('input-reading-value');
      await readingInput.fill('1500');

      // Fill in the end date
      const endDateInput = page.getByTestId('input-period-end');
      await endDateInput.fill('2026-03-28');

      // Verify usage calculation preview is showing
      await expect(page.locator('text=Mức sử dụng dự kiến')).toBeVisible();

      // Verify MediaDropzone is present (image upload area)
      await expect(page.locator('text=Ảnh minh chứng')).toBeVisible();

      // Click "Lưu nháp"
      await page.getByTestId('btn-save-draft').click();

      // Wait for success toast
      await expect(page.locator('text=Tạo nháp chốt số thành công')).toBeVisible({ timeout: 5000 });

      // Verify the new reading appears in the table with DRAFT status
      await expect(page.getByTestId('reading-status-draft').first()).toBeVisible();
    });
  });

  test.describe('2. Submit Reading for Approval', () => {
    test('should submit a DRAFT reading (DRAFT → SUBMITTED)', async ({ page }) => {
      // Navigate to meters list
      await page.goto(`/properties/${PROPERTY_ID}/meters`);
      await page.waitForLoadState('networkidle');

      // Click on the first meter
      const viewDetailBtn = page.locator('button[title="Xem chi tiết"]').first();
      await viewDetailBtn.waitFor({ state: 'visible', timeout: 10000 });
      await viewDetailBtn.click();
      await page.waitForURL(/\/meters\/[^/]+$/);

      // Look for a DRAFT reading's submit button
      const submitBtn = page.getByTestId('btn-submit-reading').first();

      if (await submitBtn.isVisible()) {
        await submitBtn.click();

        // Wait for success toast
        await expect(page.locator('text=Đã gửi duyệt chốt số')).toBeVisible({ timeout: 5000 });

        // Verify the reading now shows SUBMITTED status ("Chờ duyệt")
        await expect(page.getByTestId('reading-status-submitted').first()).toBeVisible();
      } else {
        test.skip(true, 'No DRAFT readings available to submit');
      }
    });
  });

  test.describe('3. Manager Approve/Reject', () => {
    test('should approve a SUBMITTED reading (SUBMITTED → APPROVED)', async ({ page }) => {
      // Navigate to meters list
      await page.goto(`/properties/${PROPERTY_ID}/meters`);
      await page.waitForLoadState('networkidle');

      // Navigate to first meter detail
      const viewDetailBtn = page.locator('button[title="Xem chi tiết"]').first();
      await viewDetailBtn.waitFor({ state: 'visible', timeout: 10000 });
      await viewDetailBtn.click();
      await page.waitForURL(/\/meters\/[^/]+$/);

      // Look for SUBMITTED reading's approve button
      const approveBtn = page.getByTestId('btn-approve-reading').first();

      if (await approveBtn.isVisible()) {
        await approveBtn.click();

        // Wait for success toast
        await expect(page.locator('text=Duyệt chốt số thành công')).toBeVisible({ timeout: 5000 });

        // Verify the reading now shows APPROVED status ("Đã duyệt")
        await expect(page.getByTestId('reading-status-approved').first()).toBeVisible();
      } else {
        test.skip(true, 'No SUBMITTED readings available to approve');
      }
    });

    test('should reject a SUBMITTED reading with mandatory reason (SUBMITTED → REJECTED)', async ({ page }) => {
      // First, create and submit a reading so we have something to reject
      await page.goto(`/properties/${PROPERTY_ID}/meters`);
      await page.waitForLoadState('networkidle');

      const viewDetailBtn = page.locator('button[title="Xem chi tiết"]').first();
      await viewDetailBtn.waitFor({ state: 'visible', timeout: 10000 });
      await viewDetailBtn.click();
      await page.waitForURL(/\/meters\/[^/]+$/);

      // Look for SUBMITTED reading's reject button
      const rejectBtn = page.getByTestId('btn-reject-reading').first();

      if (await rejectBtn.isVisible()) {
        await rejectBtn.click();

        // Wait for the reject modal to appear
        await expect(page.locator('text=Lý do từ chối')).toBeVisible({ timeout: 3000 });

        // Fill in rejection reason
        const reasonTextarea = page.locator('textarea').first();
        await reasonTextarea.fill('Chỉ số không khớp với ảnh chụp đồng hồ');

        // Click confirm reject
        await page.click('button:has-text("Xác nhận từ chối")');

        // Wait for success toast
        await expect(page.locator('text=Từ chối chốt số thành công')).toBeVisible({ timeout: 5000 });

        // Verify the reading now shows REJECTED status ("Từ chối")
        await expect(page.getByTestId('reading-status-rejected').first()).toBeVisible();

        // Verify rejection reason is displayed
        await expect(page.locator('text=Chỉ số không khớp với ảnh chụp đồng hồ')).toBeVisible();
      } else {
        test.skip(true, 'No SUBMITTED readings available to reject');
      }
    });
  });

  test.describe('4. Edit REJECTED & Re-submit', () => {
    test('should edit a REJECTED reading and re-submit', async ({ page }) => {
      await page.goto(`/properties/${PROPERTY_ID}/meters`);
      await page.waitForLoadState('networkidle');

      const viewDetailBtn = page.locator('button[title="Xem chi tiết"]').first();
      await viewDetailBtn.waitFor({ state: 'visible', timeout: 10000 });
      await viewDetailBtn.click();
      await page.waitForURL(/\/meters\/[^/]+$/);

      // Look for REJECTED reading's edit button
      const rejectedRow = page.locator('tr').filter({ has: page.getByTestId('reading-status-rejected') }).first();
      const editBtnForRejected = rejectedRow.getByTestId('btn-edit-reading');

      if (await editBtnForRejected.isVisible()) {
        await editBtnForRejected.click();

        // Wait for edit modal
        await expect(page.locator('text=Sửa chốt số')).toBeVisible({ timeout: 3000 });

        // Update the reading value
        const readingInput = page.locator('.fixed input[type="number"]').first();
        await readingInput.clear();
        await readingInput.fill('1600');

        // Click update
        await page.click('.fixed button:has-text("Cập nhật")');

        // Wait for success toast
        await expect(page.locator('text=Cập nhật chốt số thành công')).toBeVisible({ timeout: 5000 });

        // Now re-submit: click "Gửi lại" for the updated reading
        const resubmitBtn = page.getByTestId('btn-resubmit-reading').first();
        if (await resubmitBtn.isVisible()) {
          await resubmitBtn.click();
          await expect(page.locator('text=Đã gửi duyệt chốt số')).toBeVisible({ timeout: 5000 });
        }
      } else {
        test.skip(true, 'No REJECTED readings available to edit');
      }
    });
  });

  test.describe('5. Quick Reading Page', () => {
    test('should navigate to quick reading page and see meter inputs', async ({ page }) => {
      await page.goto(`/properties/${PROPERTY_ID}/meters/quick-reading`);
      await page.waitForLoadState('networkidle');

      // Verify page header
      await expect(page.locator('text=Chốt số nhanh')).toBeVisible({ timeout: 10000 });

      // Verify period date pickers are visible
      await expect(page.getByTestId('reading-period-start')).toBeVisible();
      await expect(page.getByTestId('reading-period-end')).toBeVisible();

      // Wait for meter inputs to appear
      const meterInputs = page.locator('[data-testid^="meter-reading-input-"]');
      await meterInputs.first().waitFor({ state: 'visible', timeout: 15000 });

      // Verify at least one meter input exists
      const count = await meterInputs.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should fill readings and save as draft', async ({ page }) => {
      await page.goto(`/properties/${PROPERTY_ID}/meters/quick-reading`);
      await page.waitForLoadState('networkidle');

      // Wait for meter inputs
      const meterInputs = page.locator('[data-testid^="meter-reading-input-"]');
      await meterInputs.first().waitFor({ state: 'visible', timeout: 15000 });

      // Get the first meter's input
      const firstInput = meterInputs.first();
      const meterId = (await firstInput.getAttribute('data-testid'))?.replace('meter-reading-input-', '');

      // Get old value
      const prevValueEl = page.getByTestId(`prev-reading-value-${meterId}`);
      const prevText = await prevValueEl.textContent() || '0';
      const prevValue = parseFloat(prevText.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, ''));

      // Fill with a valid higher value
      const newValue = Math.round(prevValue + 15);
      await firstInput.fill(newValue.toString());

      // Verify progress updates
      const progressText = await page.getByTestId('reading-progress-text').textContent();
      expect(progressText).toContain('1 /');

      // Verify consumption is calculated
      const consumptionEl = page.getByTestId(`consumption-value-${meterId}`);
      await expect(consumptionEl).not.toHaveText('-');

      // Click "Lưu nháp"
      const saveDraftBtn = page.getByTestId('btn-quick-save-draft');
      await saveDraftBtn.click();

      // Wait for success toast
      await expect(page.locator('text=Đã lưu nháp')).toBeVisible({ timeout: 10000 });
    });

    test('should fill readings and save & submit', async ({ page }) => {
      await page.goto(`/properties/${PROPERTY_ID}/meters/quick-reading`);
      await page.waitForLoadState('networkidle');

      // Wait for meter inputs
      const meterInputs = page.locator('[data-testid^="meter-reading-input-"]');
      await meterInputs.first().waitFor({ state: 'visible', timeout: 15000 });

      // Fill the first meter
      const firstInput = meterInputs.first();
      const meterId = (await firstInput.getAttribute('data-testid'))?.replace('meter-reading-input-', '');
      const prevValueEl = page.getByTestId(`prev-reading-value-${meterId}`);
      const prevText = await prevValueEl.textContent() || '0';
      const prevValue = parseFloat(prevText.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, ''));

      const newValue = Math.round(prevValue + 20);
      await firstInput.fill(newValue.toString());

      // Click "Gửi duyệt"
      const saveSubmitBtn = page.getByTestId('btn-quick-save-submit');
      await saveSubmitBtn.click();

      // Wait for success toast
      await expect(page.locator('text=Đã lưu & gửi duyệt')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('6. Image Upload Verification', () => {
    test('should show MediaDropzone in add reading form', async ({ page }) => {
      await page.goto(`/properties/${PROPERTY_ID}/meters`);
      await page.waitForLoadState('networkidle');

      const viewDetailBtn = page.locator('button[title="Xem chi tiết"]').first();
      await viewDetailBtn.waitFor({ state: 'visible', timeout: 10000 });
      await viewDetailBtn.click();
      await page.waitForURL(/\/meters\/[^/]+$/);

      // Click "Thêm chốt số mới"
      await page.getByTestId('btn-add-reading').click();

      // Verify MediaDropzone is visible
      await expect(page.locator('text=Ảnh minh chứng')).toBeVisible();

      // Look for the drop zone area (from MediaDropzone component)
      await expect(page.locator('text=Click or drag files to upload')).toBeVisible();
    });
  });
});
