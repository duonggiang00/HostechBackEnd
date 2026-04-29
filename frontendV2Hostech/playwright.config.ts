import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Load `playwright/.env` so `E2E_TENANT_EMAIL` có sẵn trước khi đọc projects. */
function loadPlaywrightEnv(): void {
  const envPath = path.join(__dirname, 'playwright', '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadPlaywrightEnv();

const hasTenantE2E = Boolean(process.env.E2E_TENANT_EMAIL?.trim());

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/manager.json',
      },
      dependencies: ['setup'],
      testIgnore: [/staff-role\.spec\.ts$/, /tenant-app\.spec\.ts$/],
    },
    {
      name: 'chromium-staff',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/staff.json',
      },
      dependencies: ['setup'],
      testMatch: /staff-role\.spec\.ts$/,
    },
    ...(hasTenantE2E
      ? [
          {
            name: 'chromium-tenant',
            use: {
              ...devices['Desktop Chrome'],
              storageState: 'playwright/.auth/tenant.json',
            },
            dependencies: ['setup'],
            testMatch: /tenant-app\.spec\.ts$/,
          },
        ]
      : []),
  ],

  webServer: {
    command: 'npm run dev -- --port 3000 --strictPort',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
