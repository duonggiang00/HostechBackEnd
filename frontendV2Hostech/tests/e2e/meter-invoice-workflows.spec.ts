import path from 'node:path';
import { test, expect, type Page, type APIResponse } from '@playwright/test';
import { resolvePropertyId } from './helpers/propertyScope';

/** Backend có thể trả 500 khi broadcast Reverb/Pusher lỗi dù dữ liệu đã ghi — E2E local thường không chạy :8080. */
async function assertOkOrBroadcastInfrastructure500(res: APIResponse): Promise<void> {
  if (res.ok()) {
    return;
  }
  const raw = await res.text();
  if (
    res.status() === 500 &&
    /BroadcastException|Pusher error|localhost:8080|Couldn.t connect to server/i.test(raw)
  ) {
    return;
  }
  throw new Error(`API ${res.status()}: ${raw.slice(0, 800)}`);
}

/** Tránh trùng với `<option>` trong `<select>` lọc trạng thái (cùng nhãn nhưng `hidden`). */
function meterStatusInTable(page: Page, label: string) {
  return page.locator('tbody').getByText(label, { exact: true }).first();
}


const AUTH_MANAGER = path.join(process.cwd(), 'playwright/.auth/manager.json');
const AUTH_STAFF = path.join(process.cwd(), 'playwright/.auth/staff.json');

async function openPropertyScope(page: Page): Promise<string> {
  await page.goto('/');
  await page.waitForURL(
    (url) =>
      url.pathname.includes('/properties/') ||
      url.pathname === '/select-property' ||
      url.pathname === '/' ||
      url.pathname.startsWith('/org'),
    { timeout: 30_000 },
  );
  await page.waitForLoadState('networkidle');
  return resolvePropertyId(page);
}

async function captureRoomFromGetRoom(page: Page, trigger: () => Promise<void>) {
  const response = page.waitForResponse(
    (r) =>
      r.request().method() === 'GET' &&
      /\/rooms\/[0-9a-f-]{36}(\?|$)/i.test(r.url()) &&
      r.status() === 200,
  );
  await trigger();
  const json = await (await response).json();
  const room = json.data ?? json;
  return room as {
    id: string;
    meters?: Array<{
      id: string;
      type: string;
      latest_reading?: number | null;
      base_reading?: number | null;
    }>;
  };
}

async function fetchFirstElectricMeterContext(
  staffPage: Page,
  propertyId: string,
): Promise<{ meterId: string; baseValue: number } | null> {
  await staffPage.goto(`/properties/${propertyId}/meters`);
  await staffPage.waitForLoadState('networkidle');
  const eye = staffPage.locator('button[title="Chi tiết chỉ số"]').first();
  if (!(await eye.isVisible().catch(() => false))) {
    return null;
  }

  const room = await captureRoomFromGetRoom(staffPage, async () => {
    await eye.click();
    await staffPage.waitForURL(/\/meters\/room\/[0-9a-f-]{36}/i, { timeout: 20_000 });
  });

  const electric = (room.meters ?? []).find((m) => m.type === 'ELECTRIC') ?? room.meters?.[0];
  if (!electric?.id) {
    return null;
  }
  const baseValue = Math.max(
    Number(electric.latest_reading ?? 0),
    Number(electric.base_reading ?? 0),
  );
  return { meterId: electric.id, baseValue };
}

function addDays(isoYmd: string, days: number): string {
  const d = new Date(isoYmd + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function apiPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function isPostMeterReadingCreate(url: string, meterId: string): boolean {
  const p = apiPath(url);
  return p.endsWith(`/meters/${meterId}/readings`);
}

test.describe.serial('chốt số (staff/manager) + phát hành hóa đơn', () => {
  test.describe.configure({ timeout: 120_000 });

  let propertyId: string;
  let meterCtx: { meterId: string; baseValue: number } | null = null;
  /** Kỳ chốt nhanh (YYYY-MM) tăng dần để tránh trùng meter + period. */
  let quickSlot = 0;

  function nextQuickPeriod(): { start: string; end: string } {
    quickSlot += 1;
    const month = String(((quickSlot - 1) % 12) + 1).padStart(2, '0');
    return { start: `2048-${month}-01`, end: `2048-${month}-28` };
  }

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH_MANAGER });
    const page = await ctx.newPage();
    propertyId = await openPropertyScope(page);
    await ctx.close();
  });

  test.beforeEach(async ({ browser }) => {
    const staffCtx = await browser.newContext({ storageState: AUTH_STAFF });
    const staffPage = await staffCtx.newPage();
    meterCtx = await fetchFirstElectricMeterContext(staffPage, propertyId);
    await staffCtx.close();
  });

  test('Meter detail: staff nháp → gửi duyệt → manager duyệt', async ({ browser }) => {
    test.skip(!meterCtx, 'Không có phòng/đồng hồ trên danh sách meters.');

    const staffCtx = await browser.newContext({ storageState: AUTH_STAFF });
    const staffPage = await staffCtx.newPage();
    const managerCtx = await browser.newContext({ storageState: AUTH_MANAGER });
    const managerPage = await managerCtx.newPage();

    try {
      const { meterId, baseValue } = meterCtx!;
      const readingValue = baseValue + 15000;

      await staffPage.goto(`/properties/${propertyId}/meters/${meterId}`);
      await staffPage.waitForLoadState('networkidle');
      await expect(staffPage.getByRole('heading', { name: 'Chi tiết đồng hồ' })).toBeVisible({ timeout: 20_000 });

      await staffPage.getByRole('button', { name: 'Thêm chốt số mới' }).click();
      const dateInputs = staffPage.locator('form').locator('input[type="date"]');
      await dateInputs.first().waitFor({ state: 'visible', timeout: 10_000 });
      const periodStart = await dateInputs.nth(0).inputValue();
      test.skip(!periodStart, 'MeterDetail cần ít nhất một lần chốt trước để có "Từ ngày" tự động.');
      const periodEnd = addDays(periodStart, 25);

      await staffPage.locator('form input[type="number"]').first().fill(String(readingValue));
      await dateInputs.nth(1).fill(periodEnd);
      await Promise.all([
        staffPage.waitForResponse(
          (r) => r.request().method() === 'POST' && r.ok() && isPostMeterReadingCreate(r.url(), meterId),
          { timeout: 40_000 },
        ),
        staffPage.locator('form').getByRole('button', { name: /^Lưu$/ }).click(),
      ]);

      await expect(meterStatusInTable(staffPage, 'Nháp')).toBeVisible({ timeout: 25_000 });
      // Gửi duyệt qua Lịch sử (bulk-submit) — ổn định hơn so với PUT từng bản trên Meter detail (một số env backend trả 500).
      await staffPage.goto(`/properties/${propertyId}/meters/history`);
      await staffPage.waitForLoadState('networkidle');
      await staffPage.locator('select').first().selectOption('DRAFT');
      await staffPage.waitForLoadState('networkidle');
      const draftRow = staffPage.locator('tbody tr').filter({ hasText: 'Nháp' }).first();
      await draftRow.locator('input[type="checkbox"]').waitFor({ state: 'visible', timeout: 15_000 });
      await draftRow.locator('input[type="checkbox"]').check();

      const bulkP = staffPage.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().includes('bulk-submit'),
        { timeout: 40_000 },
      );
      await staffPage.locator('button').filter({ hasText: 'Gửi duyệt' }).last().click();
      const bulkRes = await bulkP;
      if (!bulkRes.ok()) {
        throw new Error(
          `bulk-submit ${bulkRes.status()}: ${(await bulkRes.text()).slice(0, 900)} — với E2E local hãy đặt BROADCAST_CONNECTION=log (hoặc chạy Reverb) để tránh 500 khi broadcast.`,
        );
      }
      await staffPage.goto(`/properties/${propertyId}/meters/${meterId}`);
      await staffPage.waitForLoadState('networkidle');
      await expect(meterStatusInTable(staffPage, 'Chờ duyệt')).toBeVisible({ timeout: 25_000 });

      await managerPage.goto(`/properties/${propertyId}/meters/${meterId}`);
      await managerPage.waitForLoadState('networkidle');
      await expect(meterStatusInTable(managerPage, 'Chờ duyệt')).toBeVisible({ timeout: 20_000 });
      const approvePut = managerPage.waitForResponse(
        (r) =>
          r.request().method() === 'PUT' &&
          r.url().includes(meterId) &&
          (r.url().includes('/readings/') || r.url().includes('readings')),
        { timeout: 40_000 },
      );
      await managerPage.getByRole('row', { name: /Chờ duyệt/ }).first().getByTitle('Duyệt').click();
      await assertOkOrBroadcastInfrastructure500(await approvePut);
      await expect(meterStatusInTable(managerPage, 'Đã duyệt')).toBeVisible({ timeout: 25_000 });
    } finally {
      await staffCtx.close();
      await managerCtx.close();
    }
  });

  test('Meter detail: staff nháp → gửi duyệt → manager từ chối', async ({ browser }) => {
    test.skip(!meterCtx, 'Không có phòng/đồng hồ trên danh sách meters.');

    const staffCtx = await browser.newContext({ storageState: AUTH_STAFF });
    const staffPage = await staffCtx.newPage();
    const managerCtx = await browser.newContext({ storageState: AUTH_MANAGER });
    const managerPage = await managerCtx.newPage();

    try {
      const { meterId, baseValue } = meterCtx!;
      const readingValue = baseValue + 16000;

      await staffPage.goto(`/properties/${propertyId}/meters/${meterId}`);
      await staffPage.waitForLoadState('networkidle');

      await staffPage.getByRole('button', { name: 'Thêm chốt số mới' }).click();
      const dateInputs = staffPage.locator('form').locator('input[type="date"]');
      await dateInputs.first().waitFor({ state: 'visible', timeout: 10_000 });
      const periodStart = await dateInputs.nth(0).inputValue();
      test.skip(!periodStart, 'MeterDetail cần ít nhất một lần chốt trước để có "Từ ngày" tự động.');
      const periodEnd = addDays(periodStart, 40);

      await staffPage.locator('form input[type="number"]').first().fill(String(readingValue));
      await dateInputs.nth(1).fill(periodEnd);
      await Promise.all([
        staffPage.waitForResponse(
          (r) => r.request().method() === 'POST' && r.ok() && isPostMeterReadingCreate(r.url(), meterId),
          { timeout: 40_000 },
        ),
        staffPage.locator('form').getByRole('button', { name: /^Lưu$/ }).click(),
      ]);
      await expect(meterStatusInTable(staffPage, 'Nháp')).toBeVisible({ timeout: 25_000 });
      await staffPage.goto(`/properties/${propertyId}/meters/history`);
      await staffPage.waitForLoadState('networkidle');
      await staffPage.locator('select').first().selectOption('DRAFT');
      await staffPage.waitForLoadState('networkidle');
      const draftRow2 = staffPage.locator('tbody tr').filter({ hasText: 'Nháp' }).first();
      await draftRow2.locator('input[type="checkbox"]').waitFor({ state: 'visible', timeout: 15_000 });
      await draftRow2.locator('input[type="checkbox"]').check();
      const bulkP2 = staffPage.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().includes('bulk-submit'),
        { timeout: 40_000 },
      );
      await staffPage.locator('button').filter({ hasText: 'Gửi duyệt' }).last().click();
      const bulkRes2 = await bulkP2;
      if (!bulkRes2.ok()) {
        throw new Error(
          `bulk-submit ${bulkRes2.status()}: ${(await bulkRes2.text()).slice(0, 900)} — với E2E local hãy đặt BROADCAST_CONNECTION=log.`,
        );
      }
      await staffPage.goto(`/properties/${propertyId}/meters/${meterId}`);
      await staffPage.waitForLoadState('networkidle');
      await expect(meterStatusInTable(staffPage, 'Chờ duyệt')).toBeVisible({ timeout: 25_000 });

      await managerPage.goto(`/properties/${propertyId}/meters/${meterId}`);
      await managerPage.waitForLoadState('networkidle');
      await expect(meterStatusInTable(managerPage, 'Chờ duyệt')).toBeVisible({ timeout: 20_000 });

      managerPage.once('dialog', (d) => d.accept('E2E từ chối'));
      const rejectPut = managerPage.waitForResponse(
        (r) =>
          r.request().method() === 'PUT' &&
          r.url().includes(meterId) &&
          (r.url().includes('/readings/') || r.url().includes('readings')),
        { timeout: 40_000 },
      );
      await managerPage.getByRole('row', { name: /Chờ duyệt/ }).first().getByTitle('Từ chối').click();
      await assertOkOrBroadcastInfrastructure500(await rejectPut);
      await expect(meterStatusInTable(managerPage, 'Từ chối')).toBeVisible({ timeout: 25_000 });
    } finally {
      await staffCtx.close();
      await managerCtx.close();
    }
  });

  test('Chốt nhanh: staff gửi duyệt → lịch sử manager Duyệt tất cả', async ({ browser }) => {
    test.skip(!meterCtx, 'Không có phòng/đồng hồ trên danh sách meters.');

    const staffCtx = await browser.newContext({ storageState: AUTH_STAFF });
    const staffPage = await staffCtx.newPage();
    const managerCtx = await browser.newContext({ storageState: AUTH_MANAGER });
    const managerPage = await managerCtx.newPage();

    try {
      const { meterId, baseValue } = meterCtx!;
      await staffPage.goto(`/properties/${propertyId}/meters/quick`);
      await staffPage.waitForLoadState('networkidle');

      const readingInput = staffPage.getByTestId(`meter-reading-input-${meterId}`);
      if (!(await readingInput.isVisible().catch(() => false))) {
        test.skip(true, 'Quick reading: không có hàng đồng hồ cho meter đã chọn (hợp đồng active?).');
      }

      const q = nextQuickPeriod();
      await staffPage.getByTestId('reading-period-start').fill(q.start);
      await staffPage.getByTestId('reading-period-end').fill(q.end);
      await readingInput.fill(String(baseValue + 17000));
      const [bulkReadRes] = await Promise.all([
        staffPage.waitForResponse(
          (r) =>
            r.request().method() === 'POST' &&
            r.url().includes(`/properties/${propertyId}/meters/bulk-readings`),
          { timeout: 60_000 },
        ),
        staffPage.getByRole('button', { name: 'Gửi duyệt' }).click(),
      ]);
      await assertOkOrBroadcastInfrastructure500(bulkReadRes);

      const overlay = staffPage.getByRole('button', { name: 'Gửi duyệt ngay' });
      if (await overlay.isVisible({ timeout: 5_000 }).catch(() => false)) {
        const [bulkSubmitOverlayRes] = await Promise.all([
          staffPage.waitForResponse(
            (r) => r.request().method() === 'POST' && r.url().includes('meter-readings/bulk-submit'),
            { timeout: 60_000 },
          ),
          overlay.click(),
        ]);
        await assertOkOrBroadcastInfrastructure500(bulkSubmitOverlayRes);
      }
      await staffPage.waitForURL(/\/meters(\?|$)/, { timeout: 40_000 }).catch(() => {});

      await managerPage.goto(`/properties/${propertyId}/meters/history`);
      await managerPage.waitForLoadState('networkidle');
      await managerPage.locator('select').first().selectOption('SUBMITTED');
      await managerPage.waitForLoadState('networkidle');

      const headerCheck = managerPage.locator('thead input[type="checkbox"]');
      if (!(await headerCheck.isVisible().catch(() => false))) {
        test.skip(true, 'Không có bản SUBMITTED trên lịch sử sau chốt nhanh.');
      }
      await headerCheck.click();
      const [bulkApproveRes] = await Promise.all([
        managerPage.waitForResponse(
          (r) => r.request().method() === 'POST' && r.url().includes('meter-readings/bulk-approve'),
          { timeout: 60_000 },
        ),
        managerPage.getByRole('button', { name: 'Duyệt tất cả' }).click(),
      ]);
      await assertOkOrBroadcastInfrastructure500(bulkApproveRes);
      await expect(meterStatusInTable(managerPage, 'Đã duyệt')).toBeVisible({ timeout: 30_000 });
    } finally {
      await staffCtx.close();
      await managerCtx.close();
    }
  });

  test('Chốt nhanh: manager Lưu để duyệt → lịch sử Duyệt tất cả', async ({ browser }) => {
    test.skip(!meterCtx, 'Không có phòng/đồng hồ trên danh sách meters.');

    const managerCtx = await browser.newContext({ storageState: AUTH_MANAGER });
    const managerPage = await managerCtx.newPage();

    try {
      const { meterId, baseValue } = meterCtx!;
      await managerPage.goto(`/properties/${propertyId}/meters/quick`);
      await managerPage.waitForLoadState('networkidle');

      const readingInput = managerPage.getByTestId(`meter-reading-input-${meterId}`);
      if (!(await readingInput.isVisible().catch(() => false))) {
        test.skip(true, 'Quick reading: không có hàng đồng hồ cho meter đã chọn.');
      }

      const q = nextQuickPeriod();
      await managerPage.getByTestId('reading-period-start').fill(q.start);
      await managerPage.getByTestId('reading-period-end').fill(q.end);
      await readingInput.fill(String(baseValue + 18000));
      const [bulkReadRes2] = await Promise.all([
        managerPage.waitForResponse(
          (r) =>
            r.request().method() === 'POST' &&
            r.url().includes(`/properties/${propertyId}/meters/bulk-readings`),
          { timeout: 60_000 },
        ),
        managerPage.getByRole('button', { name: 'Lưu để duyệt' }).click(),
      ]);
      await assertOkOrBroadcastInfrastructure500(bulkReadRes2);
      await managerPage.waitForURL(/\/meters(\?|$)/, { timeout: 40_000 }).catch(() => {});

      await managerPage.goto(`/properties/${propertyId}/meters/history`);
      await managerPage.waitForLoadState('networkidle');
      await managerPage.locator('select').first().selectOption('SUBMITTED');
      await managerPage.waitForLoadState('networkidle');

      const headerCheck = managerPage.locator('thead input[type="checkbox"]');
      if (!(await headerCheck.isVisible().catch(() => false))) {
        test.skip(true, 'Không có bản SUBMITTED sau Lưu để duyệt.');
      }
      await headerCheck.click();
      const [bulkApproveRes2] = await Promise.all([
        managerPage.waitForResponse(
          (r) => r.request().method() === 'POST' && r.url().includes('meter-readings/bulk-approve'),
          { timeout: 60_000 },
        ),
        managerPage.getByRole('button', { name: 'Duyệt tất cả' }).click(),
      ]);
      await assertOkOrBroadcastInfrastructure500(bulkApproveRes2);
      await expect(meterStatusInTable(managerPage, 'Đã duyệt')).toBeVisible({ timeout: 30_000 });
    } finally {
      await managerCtx.close();
    }
  });

  test('Chốt nhanh: manager Chốt & Duyệt ngay', async ({ browser }) => {
    test.skip(!meterCtx, 'Không có phòng/đồng hồ trên danh sách meters.');

    const managerCtx = await browser.newContext({ storageState: AUTH_MANAGER });
    const managerPage = await managerCtx.newPage();

    try {
      const { meterId, baseValue } = meterCtx!;
      await managerPage.goto(`/properties/${propertyId}/meters/quick`);
      await managerPage.waitForLoadState('networkidle');

      const readingInput = managerPage.getByTestId(`meter-reading-input-${meterId}`);
      if (!(await readingInput.isVisible().catch(() => false))) {
        test.skip(true, 'Quick reading: không có hàng đồng hồ cho meter đã chọn.');
      }

      const q = nextQuickPeriod();
      await managerPage.getByTestId('reading-period-start').fill(q.start);
      await managerPage.getByTestId('reading-period-end').fill(q.end);
      await readingInput.fill(String(baseValue + 19000));
      const [bulkApproveNowRes] = await Promise.all([
        managerPage.waitForResponse(
          (r) =>
            r.request().method() === 'POST' &&
            r.url().includes(`/properties/${propertyId}/meters/bulk-readings`),
          { timeout: 60_000 },
        ),
        managerPage.getByRole('button', { name: 'Chốt & Duyệt ngay' }).click(),
      ]);
      await assertOkOrBroadcastInfrastructure500(bulkApproveNowRes);
      await expect(managerPage).toHaveURL(/\/meters/, { timeout: 30_000 });
    } finally {
      await managerCtx.close();
    }
  });

  test('Hóa đơn: manager lọc Nháp → Phát hành → trạng thái Đã phát hành', async ({ page }) => {
    await page.goto(`/properties/${propertyId}/billing`);
    await page.waitForLoadState('networkidle');

    await page.locator('select:has(option[value="DRAFT"])').first().selectOption('DRAFT');
    await page.waitForLoadState('networkidle');

    const empty = page.getByText('Chưa có hóa đơn nào');
    if (await empty.isVisible().catch(() => false)) {
      test.skip(true, 'Không có hóa đơn DRAFT để phát hành.');
    }

    await page.locator('tbody tr').first().click();
    await page.waitForURL(/\/billing\/invoices\//, { timeout: 20_000 });
    await expect(page.locator('.sticky').getByText('Nháp', { exact: true }).first()).toBeVisible({ timeout: 20_000 });

    page.once('dialog', (d) => d.accept());
    const issueWait = page.waitForResponse(
      (r) => r.request().method() === 'PUT' && r.url().includes('/invoices/') && r.url().includes('/issue'),
      { timeout: 40_000 },
    );
    await page.getByRole('button', { name: 'Phát hành' }).click();
    await assertOkOrBroadcastInfrastructure500(await issueWait);
    await expect(page.locator('.sticky').getByText('Đã phát hành', { exact: true }).first()).toBeVisible({
      timeout: 40_000,
    });
  });
});
