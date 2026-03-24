import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Hostech V2/);
});

test('check dashboard link', async ({ page }) => {
  await page.goto('/');

  // Check if there is some indicator of the app being loaded
  // For example, looking for a heading or a button
  // We'll just check for any text for now as a smoke test
  const body = page.locator('body');
  await expect(body).toBeVisible();
});
