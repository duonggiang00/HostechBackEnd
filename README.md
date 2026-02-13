# Hướng dẫn Cài đặt & Triển khai Dự án

Tài liệu này hướng dẫn chi tiết các bước để cài đặt dự án từ source code trên GitHub về môi trường local.

## 1. Yêu cầu hệ thống (Prerequisites)

Đảm bảo máy của bạn đã cài đặt các công cụ sau:

- **PHP**: >= 8.2
- **Composer**: Công cụ quản lý thư viện PHP.
- **MySQL** hoặc **MariaDB**: Cơ sở dữ liệu.
- **Node.js & NPM**: (Tùy chọn) Nếu cần build frontend assets.
- **Git**: Để clone source code.

## 2. Các bước cài đặt

### Bước 1: Clone Source Code

Mở terminal/command prompt và chạy lệnh sau để tải mã nguồn về:

```bash
git clone <URL_CUA_REPO_GITHUB>
cd <TEN_THU_MUC_DU_AN>
```

### Bước 2: Cài đặt Dependencies

Cài đặt các thư viện PHP cần thiết thông qua Composer:

```bash
composer install
```

### Bước 3: Cấu hình Môi trường

Copy file cấu hình mẫu `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Mở file `.env` và cập nhật thông tin kết nối cơ sở dữ liệu:

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=datn          # Tên database của bạn
DB_USERNAME=root          # Username DB
DB_PASSWORD=              # Password DB
```

### Bước 4: Tạo Base Application Key

```bash
php artisan key:generate
```

### Bước 5: Migration & Seeding (Quan trọng)

Chạy migration để tạo bảng và seed dữ liệu mẫu (bao gồm Roles, Permissions, Admin User):

```bash
php artisan migrate --seed
```

> **Lưu ý:** Lệnh này sẽ chạy `DatabaseSeeder`, trong đó sẽ gọi `RbacSeeder` để thiết lập quyền hạn ban đầu.

### Bước 6: Cấu hình RBAC (Phân quyền)

Dự án sử dụng cơ chế **Dynamic RBAC**. Để đảm bảo tất cả các quyền (permissions) từ Policy được đồng bộ vào Database, hãy chạy lệnh sau:

```bash
php artisan rbac:sync
```

Lệnh này sẽ quét toàn bộ các file Policy trong `app/Policies` và tạo các quyền tương ứng (ví dụ: `viewAny Properties`, `create Users`...) nếu chưa tồn tại.

### Bước 7: Khởi chạy Server

```bash
php artisan serve
```

Server sẽ chạy tại `http://127.0.0.1:8000`.

## 3. Tài liệu API

Dự án tích hợp sẵn **Scramble** để tự động tạo tài liệu API.

- Truy cập: `http://127.0.0.1:8000/docs/api`
- Tại đây bạn có thể xem danh sách API, tham số và test thử request.

## 4. Các tài khoản mẫu (nếu có từ Seeder)

Nếu bạn đã chạy `--seed`, hệ thống thường sẽ tạo sẵn một tài khoản Admin/SuperAdmin. Kiểm tra file `database/seeders/DatabaseSeeder.php` hoặc `UserSeeder.php` để biết thông tin đăng nhập mặc định (thường là `admin@example.com` / `password`).

## 5. Xử lý sự cố thường gặp

### Lỗi "Permission denied" (Linux/Mac)
```bash
chmod -R 775 storage bootstrap/cache
```

### Lỗi thiếu bảng hoặc cột
Hãy thử chạy lại migration:
```bash
php artisan migrate:refresh --seed
```

### Lỗi 403 Forbidden khi gọi API
Đảm bảo User đã được gán Role hoặc Permission phù hợp. Kiểm tra lại bằng lệnh:
```bash
php artisan rbac:sync
```
Và kiểm tra bảng `model_has_roles` hoặc `model_has_permissions` trong DB.
