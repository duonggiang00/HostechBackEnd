import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { test as setup, type Browser } from '@playwright/test';
import { E2E_DEFAULT_PASSWORD, E2E_MANAGER_EMAIL, E2E_STAFF_EMAIL, loginAs } from './helpers/login';

const authDir = 'playwright/.auth';

function ensureAuthDir(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

/**
 * Mỗi role một browser context riêng → file storageState riêng (manager / staff / tenant).
 */
async function saveStorageForEmail(browser: Browser, email: string, outPath: string): Promise<void> {
  ensureAuthDir(outPath);
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginAs(page, email, E2E_DEFAULT_PASSWORD);
  await context.storageState({ path: outPath });
  await context.close();
}

setup('auth: manager', async ({ browser }) => {
  await saveStorageForEmail(browser, E2E_MANAGER_EMAIL, `${authDir}/manager.json`);
});

setup('auth: staff', async ({ browser }) => {
  await saveStorageForEmail(browser, E2E_STAFF_EMAIL, `${authDir}/staff.json`);
});

setup('auth: tenant (optional)', async ({ browser }, testInfo) => {
  const tenantEmail = process.env.E2E_TENANT_EMAIL?.trim();
  if (!tenantEmail) {
    testInfo.skip(true, 'Thiếu E2E_TENANT_EMAIL — tạo playwright/.env từ playwright/.env.example.');
    return;
  }
  await saveStorageForEmail(browser, tenantEmail, `${authDir}/tenant.json`);
});
