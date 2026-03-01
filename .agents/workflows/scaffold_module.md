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

Policy phải implement `RbacModuleProvider` interface.

**Scoping Pattern**:
- `Staff/Manager`: Dùng Permission chuẩn + `HandlesOrgScope`.
- `Tenant`: Kiểm tra **Membership** (vd: `$model->members()->where('user_id', $user->id)->exists()`).
- Phải định nghĩa `getRolePermissions()` với đầy đủ các roles trong hệ thống.

## Bước 5: Tạo Service

Tạo file `app/Services/{ModuleName}/{ModelName}Service.php`.

Service là nơi chứa **Toàn bộ** Business Logic:
- `paginate(Request $request)`: Sử dụng Spatie QueryBuilder.
- **Consolidated Logic**: Một phương thức (vd: `addMember`) phải xử lý được logic cho nhiều vai trò (Admin/Tenant) dựa trên context người thực hiện.
- **Intelligent Status Mapping**: Tự động xác định trạng thái (vd: `PENDING` vs `APPROVED`) trong Service thay vì Controller.
- CRUD chuẩn: `store()`, `update()`, `destroy()`, `restore()`, `forceDelete()`.
- Tenant scoping: Đảm bảo kiểm tra quyền truy cập dữ liệu tầng sâu.

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

**Nguyên tắc "Thin Controller"**:
- Controller chỉ làm 3 việc: Parse Request, Authorize (`$this->authorize`), và Trả về Resource.
- **KHÔNG** viết logic nghiệp vụ, `if/else` quyền lợi phức tạp hay tương tác DB trực tiếp tại đây.
- Sử dụng `abort(code, message)` để thông báo lỗi thay vì `response()->json()`.

Method bắt buộc:
- `index()`, `store()`, `show()`, `update()`, `destroy()`, `trash()`, `restore()`, `forceDelete()`.
- Dùng `#[Group('Module Name')]` attribute cho Scramble API docs.

## Bước 9: Đăng ký Routes

Tạo file route riêng cho module trong `routes/api/{domain}.php`. 

Hệ thống sẽ tự động load file này vào group `auth:sanctum`.

Ví dụ `routes/api/room.php`:
```php
use App\Http\Controllers\Api\Property\RoomController;
use Illuminate\Support\Facades\Route;

Route::apiResource('rooms', RoomController::class);
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
