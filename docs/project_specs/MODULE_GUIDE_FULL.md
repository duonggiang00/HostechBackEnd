# Hướng dẫn Phát triển & Mở rộng Module (Full Stack)

Tài liệu này hướng dẫn chi tiết quy trình xây dựng hoặc mở rộng một module chức năng, tuân thủ kiến trúc **Domain-Driven Directory Structuring** (Gom nhóm theo nghiệp vụ) của dự án. 

> [!IMPORTANT]
> **Ưu tiên sử dụng AI Workflows**: Để đảm bảo tính đồng nhất và tốc độ, hãy ưu tiên sử dụng các slash commands tích hợp sẵn trong tệp cấu trúc `.agents/workflows/`.

## 🚀 AI-Assisted Workflows (Recommended)
Sử dụng các lệnh sau để tự động hóa quy trình:
- `/scaffold_module`: Thực hiện Bước 1 đến Bước 11 một cách tự động khi tạo module mới.
- `/extend_module`: Sử dụng khi cần thêm tính năng mới vào module đã có.
- `/audit_module`: Kiểm tra sự tuân thủ kiến trúc của một Domain bất kỳ.
- `/finalize_module`: Chạy Pint, Sync RBAC và kiểm tra cuối cùng trước khi hoàn tất.

---

## I. Giải thích các Hàm/Trait Tiện ích Cốt lõi (Utility Functions)
Hệ thống Laravel này đã được custom lại chặt chẽ với các Trait & Interface dùng chung. **BẮT BUỘC** phải nắm rõ khi tạo Module mới:

1. **`MultiTenant`** (Trait cho Model): 
   - **Tác dụng:** Tự động áp dụng Global Scope để chỉ lấy các record có `org_id` khớp với `org_id` của user đang thao tác. Ngăn chặn tuyệt đối việc tổ chức A nhìn thấy dữ liệu của tổ chức B. Bạn không cần tự viết `->where('org_id', ...)` nữa.
2. **`SystemLoggable`** (Trait cho Model):
   - **Tác dụng:** Tự động "bắt" các sự kiện `created`, `updated`, `deleted`, `restored` của Model và lưu lại lịch sử thay đổi vào bảng `audit_logs`. Nó cung cấp "dấu vết" cho toàn bộ hệ thống.
3. **`HasUuids`** (Trait cho Model của Laravel):
   - **Tác dụng:** Tự động sinh chuỗi UUID (VD: `550e8400-e29b-...`) để gán làm khóa chính `id` khi khởi tạo record.
4. **`RbacModuleProvider`** (Interface cho Policy):
   - **Tác dụng:** Đánh dấu một `Policy` là nguồn cung cấp Quyền (Permissions). Hệ thống sẽ chạy lệnh quét để tự động đọc `getModuleName` và `getRolePermissions` nhằm nhét các quyền CRUD vào Database.
5. **`HandlesOrgScope`** (Trait cho Policy):
   - **Tác dụng:** Cung cấp hàm `$this->checkOrgScope($user, $model)`. Hàm này kiểm tra "Vật lý" xem `org_id` của Record đang truy vấn có khớp với User không (Đề phòng rò rỉ qua các lỗ hổng URL).
6. **`Spatie/QueryBuilder`** (Package cho Service/Controller):
   - **Tác dụng:** Tự động "dịch" các Query Params từ URL thành Eloquent Query. Vd: `?filter[status]=ACTIVE&sort=-created_at`. Giúp tiết kiệm hàng chục dòng code `if/else`.

---

## II. Quy trình Chi tiết (7 Bước Tạo Module Mới)

### Bước 1: Khởi tạo Cấu trúc File (Domain-driven)
Chúng ta gom tệp vể đúng thư mục tính năng của nó. Ví dụ tính năng "TestFeature" thuộc domain "Test":

```bash
# Tao Database Migration
php artisan make:migration create_test_features_table

# Tạo Model
php artisan make:model Test/TestFeature

# Tạo Service Layer (Nơi chứa Business Logic)
php artisan make:class Services/Test/TestFeatureService

# Tạo Controllers & API (Giao tiếp HTTP)
php artisan make:controller Api/Test/TestFeatureController
php artisan make:resource Test/TestFeatureResource
php artisan make:request Test/TestFeatureStoreRequest

# Tạo Policy (Bơm vào hệ thống cấm/cho phép)
php artisan make:policy Test/TestFeaturePolicy --model=Test/TestFeature
```

### Bước 2: Thiết lập Database Migration & Model

**2.1. Migration:** Luôn nhớ UUID và `org_id`.
```php
Schema::create('test_features', function (Blueprint $table) {
    $table->uuid('id')->primary(); // Bắt buộc
    // Bắt buộc liên kết Org để MultiTenant hoạt động
    $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete(); 
    
    // Các fields của module
    $table->string('name');
    $table->boolean('is_active')->default(true);
    
    $table->timestamps();
    $table->softDeletes(); // Nếu module yêu cầu thùng rác
});
```

**2.2. Model (`app/Models/Test/TestFeature.php`):** Tích hợp Trait cốt lõi.
```php
namespace App\Models\Test;

use App\Models\Concerns\MultiTenant;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TestFeature extends Model
{
    use HasUuids, MultiTenant, SystemLoggable, SoftDeletes;

    protected $fillable = ['org_id', 'name', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
```

### Bước 3: Build Service Layer (Nơi chứa logic duy nhất)

Service làm nhiệm vụ xử lý nghiệp vụ cho tất cả các vai trò. Controller **KHÔNG** được chứa logic rẽ nhánh theo Role.

`app/Services/Test/TestFeatureService.php`:
```php
class TestFeatureService
{
    public function paginate(User $user, array $filters = [])
    {
        $query = QueryBuilder::for(TestFeature::class)->allowedFilters($filters);

        // Pattern: Membership-based scoping cho Tenant
        if ($user->hasRole('Tenant')) {
            $query->whereHas('contract.members', function($q) use ($user) {
                $q->where('user_id', $user->id)->where('status', 'APPROVED');
            });
        }

        return $query->paginate()->withQueryString();
    }

    public function create(array $data, User $performer): TestFeature
    {
        // Consolidated Logic: Tự động gán status dựa trên performer
        $data['status'] = $performer->hasRole('Tenant') ? 'PENDING' : 'APPROVED';
        $data['org_id'] = $performer->org_id;

        return TestFeature::create($data);
    }
}
```

### Bước 4: Thiết lập Form Requests (Kiểm tra Dữ liệu User Test)
Đầu vào dơ = Database dơ. Validate là rào chắn đầu.

`app/Http/Requests/Test/TestFeatureStoreRequest.php`:
```php
namespace App\Http\Requests\Test;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Yêu cầu lưu TestFeature.
 * 
 * @bodyParam name string Tên của feature. Example: Tính năng A
 * @bodyParam is_active boolean Trạng thái hoạt động. Example: true
 */
class TestFeatureStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; } // Policy sẽ quản lý auth thực tế

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'] // Mặc định validate kiểu dữ liệu
        ];
    }
}
```

### Bước 5: Phân Quyền Xuyên Suốt (RBAC + Policy)

Đây là bước để hệ thống tự biết tới Module mới của bạn.
`app/Policies/Test/TestFeaturePolicy.php`:

```php
namespace App\Policies\Test;

use App\Contracts\RbacModuleProvider; // INTERFACE KHỞI NGUỒN PHÂN QUYỀN
use App\Models\Test\TestFeature;
use App\Models\Org\User;
use App\Traits\HandlesOrgScope;

class TestFeaturePolicy implements RbacModuleProvider
{
    use HandlesOrgScope; 

    // 1. Khai báo Tên Nhóm Quyền (Permission Prefix)
    public static function getModuleName(): string { return 'TestFeature'; }

    // 2. Định nghĩa Base/Default Permissions khi Sync Role
    public static function getRolePermissions(): array
    {
        return [
            'Owner'   => 'CRUD', // Cầm trịch toàn bộ
            'Manager' => 'CRUD', 
            'Staff'   => 'RU',   // Chỉ xem và update, không được xóa
            'Tenant'  => 'R',    // Chỉ Xem
        ];
    }

    // 3. Logic xác nhận quyền view list
    public function viewAny(User $user): bool {
        return $user->hasPermissionTo('viewAny TestFeature');
    }

    // 3. Logic xác nhận View chi tiết
    public function view(User $user, TestFeature $item): bool {
        // Tầm vực Manager/Staff: Permission + Org check
        if ($user->hasPermissionTo('view TestFeature') && ! $user->hasRole('Tenant')) {
             return $this->checkOrgScope($user, $item); 
        }

        // Tầm vực Tenant: Dựa trên Membership (Phải thuộc về bản ghi đó)
        return $item->contract?->members()->where('user_id', $user->id)->exists();
    }
    
    // Tạo, Sửa, Xóa tương tự theo pattern này...
}
```

🚨 **LƯU Ý:** Bạn VỪA TẠO policy cung cấp quyền mới. Gõ ngay Terminal:
```bash
php artisan pb:sync
# Hoặc lệnh quét của hệ thống: php artisan rbac:sync
```

### Bước 6: API Resource & Controller (Điểm Cuối)

**Định hình Output (Resource):**
```php
namespace App\Http\Resources\Test;
use Illuminate\Http\Resources\Json\JsonResource;

class TestFeatureResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id, // Trả UUID sạch
            'name' => $this->name,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
```

**Controller Lắp Ráp:**
```php
namespace App\Http\Controllers\Api\Test;

use App\Http\Controllers\Controller;
use App\Services\Test\TestFeatureService;
use App\Models\Test\TestFeature;
use App\Http\Requests\Test\TestFeatureStoreRequest;
use App\Http\Resources\Test\TestFeatureResource;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;

class TestFeatureController extends Controller
{
    public function __construct(protected TestFeatureService $service) {}

    public function index(Request $request)
    {
        // 1. Phân quyền tổng
        $this->authorize('viewAny', TestFeature::class);

        // 2. Chấp nhận filter URL từ Client (Vd: ?filter[is_active]=1)
        $filters = ['is_active']; 

        // 3. Chạy qua Service
        $paginator = $this->service->paginate(
            user: $request->user(),
            perPage: (int) $request->input('per_page', 15)
        );

        // 4. Output List
        return TestFeatureResource::collection($paginator);
    }

    public function store(TestFeatureStoreRequest $request)
    {
        // 1. Phân quyền tạo
        $this->authorize('create', TestFeature::class);
        
        // 2. Lấy dữ liệu an toàn & Gán dữ liệu bắt buộc (org_id)
        $data = $request->validated();
        $data['org_id'] = auth()->user()->org_id; 

        // 3. Ghi CSDL
        $item = $this->service->create($data);
        
        return new TestFeatureResource($item);
    }
}
```

### Bước 7: Đăng ký Router (Modularized)
Không viết trực tiếp vào `api.php`. Hãy tạo file mới: `routes/api/{domain}.php`.

Hệ thống sẽ quét thư mục `routes/api/` và tự động nạp các routes này vào middleware `auth:sanctum`.

Ví dụ: `routes/api/test.php`
```php
use App\Http\Controllers\Api\Test\TestFeatureController;
use Illuminate\Support\Facades\Route;

// Tự sinh toàn bộ (index, store, show, update, destroy)
Route::apiResource('test-features', TestFeatureController::class);
```

Chạy `php artisan optimize:clear` là API của bạn đã sẵn sàng và an toàn tuyệt đối ở mọi tầng kiến trúc!
