# Hostech - Hệ thống Quản lý Lưu trú

Dự án này được chia thành hai phần chính: BE và FE

## Cấu trúc Dự án

- `backend/`: Chứa mã nguồn Laravel (API, Database, Logic).
- `frontend/`: Chứa mã nguồn Frontend (sẽ được triển khai sau).

## Hướng dẫn Cài đặt & Triển khai Backend

Vui lòng truy cập thư mục [backend/](file:///c:/laragon/www/laravel/HostechBackEnd/backend) để xem chi tiết hướng dẫn cài đặt.

### Các bước nhanh:
1. `cd backend`
2. `composer install`
3. `cp .env.example .env` (và cấu hình DB)
4. `php artisan key:generate`
5. `php artisan migrate --seed`
6. `php artisan rbac:sync`
7. `php artisan serve`

---

## Tài liệu API
- Sau khi chạy server, truy cập: `http://127.0.0.1:8000/docs/api`
