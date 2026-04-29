# Playwright E2E

## Tài khoản cố định

| Vai trò  | Email                         | Mật khẩu  |
|----------|-------------------------------|------------|
| Manager  | `test_manager_1@example.com`  | `12345678` |
| Staff    | `test_staff_1@example.com`    | `12345678` |
| Tenant   | Lấy từ DB (xem bên dưới)      | `12345678` |

## Tenant: lấy email bằng Tinker

Từ thư mục `backend`:

```bash
php artisan tinker --execute="echo optional(\App\Models\Org\Org::where('name','test')->first()) ? (\App\Models\Org\User::role('Tenant')->where('org_id', \App\Models\Org\Org::where('name','test')->first()->id)->orderBy('email')->value('email') ?? 'NO_TENANT') : 'NO_ORG';"
```

Trong `frontendV2Hostech`, tạo `playwright/.env` (copy từ `playwright/.env.example`) và gán:

```env
E2E_TENANT_EMAIL=email@lay-tu-tinker
```

Nếu không đặt `E2E_TENANT_EMAIL`, project `chromium-tenant` sẽ không được đăng ký và bước setup tenant bị skip.

## Cấu trúc test (đã dọn)

| File | Project | Mô tả |
|------|-----------|--------|
| `auth.setup.ts` | `setup` | Lưu `manager.json`, `staff.json`, `tenant.json` (tuỳ env). |
| `manager.spec.ts` | `chromium` | Smoke + RBAC biên lai (Manager). |
| `meter-invoice-workflows.spec.ts` | `chromium` | Luồng chốt số (Meter detail + chốt nhanh + lịch sử) và phát hành hóa đơn DRAFT→ISSUED (dùng `browser.newContext` cho Staff). |
| `staff-role.spec.ts` | `chromium-staff` | Staff vào xét duyệt thanh toán. |
| `tenant-app.spec.ts` | `chromium-tenant` | Tenant vào `/app` (cần `E2E_TENANT_EMAIL`). |
| `helpers/login.ts` | — | Đăng nhập dùng chung. |
| `helpers/propertyScope.ts` | — | Lấy `propertyId` từ URL / chọn tòa. |

## Chạy test

```bash
cd frontendV2Hostech
npm run test:e2e
```

Backend API phải chạy và CORS/base URL khớp với Vite (thường `http://localhost:8000` trong `.env` frontend).

### Chốt số / hóa đơn (`meter-invoice-workflows.spec.ts`)

Nếu API trả **500** kiểu `Pusher error` / `BroadcastException` (không kết nối được `localhost:8080` Reverb), trong `.env` **backend** nên dùng log thay vì broadcast sync, ví dụ:

```env
BROADCAST_CONNECTION=log
```

Hoặc chạy Reverb đúng cổng cấu hình. Một số bước (bulk-submit nháp) yêu cầu HTTP **200**; các bước duyệt/phát hành sau đó vẫn có thể chịu lỗi broadcast tùy code backend.
