---
description: Scaffold a new module following the project DDD pattern
---

# /scaffold_module — Khởi tạo Module mới

// turbo-all

## Bước 1: Tạo thư mục cấu trúc

Tạo các thư mục cần thiết trong project:

```
app/
  Http/Controllers/Api/{ModuleName}/
  Http/Requests/{ModuleName}/
  Http/Resources/{ModuleName}/
  Models/{ModuleName}/
  Policies/{ModuleName}/
  Services/{ModuleName}/
```

## Bước 2: Tạo Migration

Chạy lệnh:
```bash
php artisan make:migration create_{table_name}_table
```

Cấu trúc bắt buộc phải có:
- `$table->uuid('id')->primary()`
- `$table->uuid('org_id')->index()`
- `$table->softDeletes()`
- `$table->timestamps()`

## Bước 3: Tạo Model

Chạy:
```bash
php artisan make:model {ModuleName}/{ModelName}
```

Traits bắt buộc:
- `HasUuids` (Illuminate\Database\Eloquent)
- `MultiTenant` (App\Models\Concerns)
- `SoftDeletes`
- `SystemLoggable` (nếu cần audit log)

## Bước 4: Tạo Policy

Chạy:
```bash
php artisan make:policy {ModuleName}/{ModelName}Policy --model={ModuleName}/{ModelName}
```

Policy phải implement `RbacModuleProvider` interface:
- `getModuleName(): string`
- `getRolePermissions(): array` với đầy đủ roles

## Bước 5: Tạo Service

Tạo file `app/Services/{ModuleName}/{ModelName}Service.php`.

Service phải extend hoặc bao gồm:
- `paginate(Request $request)` với Spatie QueryBuilder
- CRUD: `store()`, `update()`, `destroy()`
- Soft delete: `trash()`, `restore()`, `forceDelete()`
- Tenant scoping nếu Tenant cần truy cập

## Bước 6: Tạo Form Requests

```bash
php artisan make:request {ModuleName}/{ModelName}IndexRequest
php artisan make:request {ModuleName}/{ModelName}StoreRequest
php artisan make:request {ModuleName}/{ModelName}UpdateRequest
```

## Bước 7: Tạo Resource

```bash
php artisan make:resource {ModuleName}/{ModelName}Resource
```

Bắt buộc định nghĩa đầy đủ fields trong `toArray()`, không dùng `parent::toArray()`.

## Bước 8: Tạo Controller

```bash
php artisan make:controller Api/{ModuleName}/{ModelName}Controller
```

Controller phải có các method:
- `index()` — paginate với policy viewAny
- `store()` — create với policy create
- `show()` — view với policy view
- `update()` — update với policy update
- `destroy()` — soft delete với policy delete
- `trash()` — danh sách đã xóa
- `restore()` — khôi phục
- `forceDelete()` — xóa vĩnh viễn

Dùng `#[Group('Module Name')]` attribute cho Scramble API docs.

## Bước 9: Đăng ký Routes

Trong `routes/api.php`, trong group `auth:sanctum`:

```php
// {ModuleName}
Route::get('{resource}/trash', [{Controller}::class, 'trash']);
Route::apiResource('{resource}', {Controller}::class);
Route::post('{resource}/{id}/restore', [{Controller}::class, 'restore']);
Route::delete('{resource}/{id}/force', [{Controller}::class, 'forceDelete']);
```

## Bước 10: Đăng ký Policy

Trong `App\Providers\AuthServiceProvider`:
```php
protected $policies = [
    // Existing...
    {Model}::class => {Model}Policy::class,
];
```

## Bước 11: Chạy seeder RBAC

Sau khi thêm Policy với `getRolePermissions()`, chạy:
```bash
php artisan db:seed --class=RbacSeeder
```

## Bước 12: Viết Test

```bash
php artisan make:test {ModuleName}/{ModelName}Test
```

Test tối thiểu phải cover:
- Authenticated user can list resources
- Authorized user can create
- Unauthorized user gets 403
- Tenant scoping (nếu applicable)

## Bước 13: Cập nhật Docs

Tạo file `docs/modules/NN_{module_name}.md` theo cấu trúc:
- Tổng quan (Controller, Service, Policy)
- Bảng Endpoints đầy đủ
- Cấu trúc DB
- RBAC matrix
- Lưu ý thiết kế
