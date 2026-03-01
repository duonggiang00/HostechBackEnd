---
description: Rà soát module so với tiêu chuẩn kiến trúc dự án
---
# Workflow Rà soát Module (Audit Module)

Khi nhận lệnh `/audit_module {Domain}`, hãy thực hiện các bước kiểm tra chuyên sâu sau:

## Bước 1: Kiểm tra Model
- Đảm bảo Model nằm trong namespace đúng (`App\Models\{Domain}`).
- Kiểm tra các Traits bắt buộc: `HasUuids`, `MultiTenant`, `SoftDeletes`.
- Đảm bảo khóa chính `id` có `$incrementing = false` và `$keyType = 'string'`.
- **Laravel 12 Standard**: Chuyển `$casts` property sang phương thức `protected function casts(): array`.

## Bước 2: Kiểm tra Service Layer
- Đảm bảo logic nghiệp vụ nằm hoàn toàn trong Service.
- Kiểm tra phương thức `paginate()` sử dụng `Spatie\QueryBuilder`.
- Kiểm tra việc sử dụng `DB::transaction()` cho các thao tác ghi dữ liệu phức tạp.
- Đảm bảo có đầy đủ return type hints.

## Bước 3: Kiểm tra Policy & RBAC
- Policy phải implement `App\Contracts\RbacModuleProvider`.
- **Scoping Check**: Kiểm tra xem Policy đã áp dụng "Membership-based scoping" cho Tenant chưa (không chỉ dựa vào permission).
- Kiểm tra phương thức `getRolePermissions()` đã định nghĩa đủ quyền cho các vai trò mặc định (`Owner`, `Manager`, `Staff`, `Tenant`).
- Đảm bảo sử dụng `HandlesOrgScope` trait cho cấp quản lý.

## Bước 4: Kiểm tra API Layer
- **FormRequests**: Mọi request Input phải qua FormRequest.
- **Resources**: Mọi response Output phải qua Eloquent Resource. Kiểm tra tính đầy đủ của fields (status, name, phone...).
- **Thin Controller**: Đảm bảo Controller không chứa logic nghiệp vụ.
- **Error Handling**: Kiểm tra việc sử dụng `abort()` thay cho thủ công `json()`.
- **Scramble Docs**: Controller method `index` PHẢI có các `@queryParam` theo chuẩn `AGENTS.md`.

## Bước 5: Kiểm tra Routes
- Module phải có file route riêng trong `routes/api/{domain}.php`.
- Đảm bảo không viết route trực tiếp vào `routes/api.php`.

## Bước 6: Tổng hợp báo cáo
- Xuất danh sách các điểm "Đạt" và "Chưa đạt".
- Đưa ra các Code Snippets cụ thể để khắc phục lỗi.
