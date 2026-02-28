# Hướng dẫn tạo mới Module (Domain-Driven Architecture)

Dự án này tuân thủ cấu trúc thư mục dạng **Domain-Driven**. Nghĩa là thay vì vứt tất cả Controllers, Models vào chung một cục, ta sẽ chia thư mục theo từng Domain (Ví dụ: `Org`, `Property`, `Service`, `Invoice`, `Ticket`).

Khi phát triển một Domain/Module mới (Ví dụ: Module `Vehicle`), bạn **BẮT BUỘC** phải tuân theo luồng sau:

## Bước 1: Khởi tạo Model & Migration
1. Chạy lệnh tạo Model kèm Migration, Factory, Seeder:
   `php artisan make:model Vehicle\Vehicle -mfs`
2. Di chuyển các file được tạo vào đúng thư mục:
   - File Model đặt tại: `app/Models/Vehicle/Vehicle.php`
   - Đảm bảo namespace là `namespace App\Models\Vehicle;`
3. Cập nhật file Migration để chắc chắn nó có `org_id` (Dùng cho Multi-tenancy) bằng định dạng `uuid`.

## Bước 2: Tạo Service Layer (Nơi chứa Business Logic)
Tuyệt đối không viết logic xử lý phức tạp trong Controller. Dữ liệu sẽ đi từ `Controller -> Service -> Model`.
1. Tạo file Service thủ công: `app/Services/Vehicle/VehicleService.php`
2. Kế thừa `App\Services\BaseService` (nếu có) hoặc tự định nghĩa CRUD chuẩn. Mọi quá trình filter, paginate sử dụng `Spatie\QueryBuilder`.

## Bước 3: Tạo Form Requests
1. Chạy lệnh:
   - `php artisan make:request Vehicle/VehicleStoreRequest`
   - `php artisan make:request Vehicle/VehicleUpdateRequest`
   - `php artisan make:request Vehicle/VehicleIndexRequest`
2. Bổ sung các `@bodyParam` Docs vào phía trên Class để Scramble tự build tài liệu.

## Bước 4: Tạo API Resource
1. Chạy lệnh:
   `php artisan make:resource Vehicle/VehicleResource`
2. Format dữ liệu JSON trả về cho Frontend. Không ném toàn bộ `$this->toArray()` nếu có dữ liệu nhạy cảm.

## Bước 5: Tạo Controller
1. Chạy lệnh tạo API Controller:
   `php artisan make:controller Api/Vehicle/VehicleController --api`
2. Trong Controller này, Inject `VehicleService` qua hàm Constructor.
3. Controller chỉ có nhiệm vụ 3 bước: 
   - Hứng Request (đã được valid by FormRequest).
   - Truyền data vào Service.
   - Trả kết quả về bằng Resource.
4. Đặt attribute `#[Group('Quản lý Phương tiện')]` lên đầu class Controller. Bổ sung `@queryParam` cho hàm `index` và `trash`.

## Bước 6: Khai báo Routes
Mở `routes/api.php`, khai báo API resource theo khối:
```php
// Vehicles
Route::get('vehicles/trash', [VehicleController::class, 'trash']);
Route::apiResource('vehicles', VehicleController::class);
Route::post('vehicles/{id}/restore', [VehicleController::class, 'restore']);
Route::delete('vehicles/{id}/force', [VehicleController::class, 'forceDelete']);
```

## Bước 7: Phân quyền (RBAC Policy)
1. Tạo Policy: `php artisan make:policy VehiclePolicy --model=Vehicle\Vehicle`
2. Di chuyển Policy vào thư mục `app/Policies/Vehicle/VehiclePolicy.php`.
3. Implement interface `App\Contracts\RbacModuleProvider`. Kệ thừa traits tính năng.
4. Chạy `php artisan rbac:sync` sau khi code xong Policy.

## Bước 8: Viết UnitTest
1. Tạo Test: `php artisan make:test VehicleTest --filter=Feature`
2. Verify lại các điểm cuối API đã hoạt động.
