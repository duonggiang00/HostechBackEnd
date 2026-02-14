# Hướng dẫn Phát triển Module mới (Full Stack)

Tài liệu này hướng dẫn chi tiết quy trình xây dựng một module chức năng mới (ví dụ: `Contract`, `Booking`, `ServiceOrder`...) từ con số 0, tuân thủ kiến trúc chuẩn của dự án.

## Kiến trúc Chuẩn

Dự án tuân theo mô hình phân lớp:
1.  **Model**: Entity dữ liệu, tích hợp các Trait hệ thống (UUID, Multi-tenant, Audit Log).
2.  **Service**: Chứa Business Logic (CRUD, tính toán, xử lý dữ liệu). Controller **không** nên gọi trực tiếp Eloquent.
3.  **Policy (RBAC)**: Quản lý quyền truy cập Dynamic.
4.  **Controller**: Tiếp nhận Request, gọi Service, trả về Resource. Tích hợp tài liệu API (Scramble).
5.  **API Resource**: Định dạng dữ liệu trả về JSON.

---

## Quy trình Chi tiết (7 Bước)

### Bước 1: Database & Model

Tạo Model kèm theo Migration:

```bash
php artisan make:model Contract -m
```

**1.1. Migration:**
Lưu ý sử dụng `uuid` làm khóa chính và thêm cột `org_id` để hỗ trợ Multi-tenancy.

```php
// database/migrations/xxxx_create_contracts_table.php
Schema::create('contracts', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete(); // Bat buoc
    $table->string('code')->unique();
    $table->string('name');
    // ... custom columns
    $table->timestamps();
    $table->softDeletes(); // Khuyen khich
});
```

**1.2. Model:**
Tích hợp các Trait quan trọng:

```php
// app/Models/Contract.php
namespace App\Models;

use App\Models\Concerns\MultiTenant;       // <--- Scope theo Admin/User Org
use App\Traits\SystemLoggable;             // <--- Tu dong ghi Audit Log
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contract extends Model
{
    use HasUuids, MultiTenant, SystemLoggable, SoftDeletes;

    protected $fillable = [
        'org_id', 'code', 'name', // ...
    ];

    // Định nghĩa relationship nếu có
    public function org() {
        return $this->belongsTo(Org::class);
    }
}
```

### Bước 2: Service Layer

Tạo Service class để xử lý logic. Nếu logic đơn giản, có thể dùng Base Service hoặc viết trực tiếp các hàm CRUD.

```php
// app/Services/ContractService.php
namespace App\Services;

use App\Models\Contract;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class ContractService
{
    /**
     * Paginate with Search & Filter
     * 
     * @param array $allowedFilters param cho Spatie QueryBuilder
     * @param int $perPage
     * @param string|null $search Search term
     */
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(Contract::class)
            ->allowedFilters($allowedFilters)
            ->defaultSort('-created_at');

        // 1. Manual Search Logic
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // 2. Manual Top-level Filters (Important!)
        // Handle explicit params like ?org_id=... if needed directly
        if ($orgId = request()->input('org_id')) {
            $query->where('org_id', $orgId);
        }

        // 3. Global Scopes (MultiTenant) are applied automatically by Model Trait

        return $query->paginate($perPage)->withQueryString();
    }

    public function create(array $data): Contract
    {
        return Contract::create($data);
    }

    public function update(string $id, array $data): ?Contract
    {
        $contract = $this->find($id);
        if ($contract) {
            $contract->update($data);
        }
        return $contract;
    }
    
    public function find(string $id): ?Contract
    {
        return Contract::find($id);
    }

    // ... delete, restore impl
}
```

### Bước 3: Request Validation

Tạo FormRequest để validate dữ liệu đầu vào.

```bash
php artisan make:request ContractStoreRequest
```

```php
// app/Http/Requests/ContractStoreRequest.php
public function rules(): array
{
    return [
        'name' => ['required', 'string', 'max:255'],
        'code' => ['required', 'string', 'unique:contracts,code'],
        // khong can validate org_id neu lay tu Auth user
    ];
}
```

### Bước 4: Policy & Dynamic RBAC (Quan trọng)

Đây là bước để hệ thống tự động nhận diện quyền.

```bash
php artisan make:policy ContractPolicy --model=Contract
```

Sửa file `app/Policies/ContractPolicy.php`:

```php
namespace App\Policies;

use App\Contracts\RbacModuleProvider; // [!] Interface bat buoc
use App\Models\Contract;
use App\Models\User;
use App\Traits\HandlesOrgScope;       // [!] Trait bat buoc
use Illuminate\Auth\Access\Response;

class ContractPolicy implements RbacModuleProvider
{
    use HandlesOrgScope;

    // 1. Tên Module hiển thị trong Permission (vd: 'viewAny Contract')
    public static function getModuleName(): string
    {
        return 'Contract';
    }

    // 2. Ma trận phân quyền
    public static function getRolePermissions(): array
    {
        return [
            'Owner'   => 'CRUD', // Full quyền
            'Manager' => 'RU',   // Xem & Sửa
            'Staff'   => 'R',    // Chỉ xem
            'Tenant'  => '-',    // Không truy cập
        ];
    }

    // 3. Implement methods
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny Contract');
    }

    public function view(User $user, Contract $contract): bool
    {
        if (! $user->hasPermissionTo('view Contract')) return false;
        return $this->checkOrgScope($user, $contract); // User chỉ xem được Contract của Org mình
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Contract');
    }

    // ... update, delete tương tự
}
```

### Bước 5: Controller & API Documentation

Tạo Controller và thêm document cho Scramble.

```bash
php artisan make:controller Api/ContractController
```

```php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ContractService;
use App\Models\Contract;
use Dedoc\Scramble\Attributes\Group; // [!] Group API Docs

/**
 * Quản lý Hợp đồng (Contracts)
 * 
 * API quản lý hợp đồng thuê nhà...
 */
#[Group('Quản lý Hợp đồng')]
class ContractController extends Controller
{
    public function __construct(protected ContractService $service) {}

    /**
     * Danh sách hợp đồng
     * 
     * Lấy danh sách có phân trang và lọc.
     */
    public function index()
    {
        $this->authorize('viewAny', Contract::class);
        return $this->service->paginate(['code', 'name']);
    }

    /**
     * Tạo hợp đồng mới
     */
    public function store(ContractStoreRequest $request)
    {
        $this->authorize('create', Contract::class);
        
        $data = $request->validated();
        
        // Tự động gán Org ID từ User
        /** @var \App\Models\User $user */
        $user = auth()->user();
        if ($user->org_id) {
            $data['org_id'] = $user->org_id;
        }

        return $this->service->create($data);
    }
}
```

### Bước 6: Đăng ký & Đồng bộ

**6.1. Routes:**
Thêm vào `routes/api.php`:

```php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('contracts', \App\Http\Controllers\Api\ContractController::class);
});
```

**6.2. Đồng bộ RBAC:**
Chạy lệnh sau để tạo Permission trong DB:

```bash
php artisan rbac:sync
```

### Bước 7: Kiểm thử

1.  Truy cập `http://localhost:8000/docs/api` để xem API mới đã hiện lên chưa.
2.  Dùng Postman hoặc Scramble "Try it out" để gọi API.
3.  Kiểm tra bảng `activity_log` xem log có được ghi lại khi Create/Update không.

---

## Mẹo (Tips)

- **Filter**: Để filter theo field mới, chỉ cần thêm tên field vào mảng `$allowedFilters` trong Controller/Service.
- **Scope**: Trait `MultiTenant` trong Model sẽ tự động filter query theo `org_id` của User đăng nhập, bạn không cần `where('org_id', ...)` thủ công trong Service (trừ trường hợp đặc biệt).
- **Format Date**: Nếu API cần trả về định dạng ngày tháng cụ thể, hãy dùng API Resource (`php artisan make:resource ContractResource`).
