import type { Page } from '@playwright/test';

/**
 * Lấy `propertyId` từ URL hiện tại hoặc từ trang chọn tòa nhà.
 */
export async function resolvePropertyId(page: Page): Promise<string> {
  const fromUrl = page.url().match(/\/properties\/([a-fA-F0-9-]{36})/);
  if (fromUrl) {
    return fromUrl[1];
  }

  const firstCard = page.locator('a[href*="/properties/"], button:has-text("Quản lý")').first();
  await firstCard.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined);
  if (await firstCard.isVisible().catch(() => false)) {
    await firstCard.click();
    await page.waitForURL('**/properties/**', { timeout: 15_000 });
  }

  const m = page.url().match(/\/properties\/([a-fA-F0-9-]{36})/);
  if (!m) {
    throw new Error('Không xác định được propertyId (cần đăng nhập Manager/Staff và chọn tòa nhà).');
  }
  return m[1];
}
