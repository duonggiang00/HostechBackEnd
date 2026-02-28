# MODULE_GUIDE — Hướng dẫn tạo Module mới

> Xem chi tiết hơn tại [`project_specs/MODULE_GUIDE_FULL.md`](project_specs/MODULE_GUIDE_FULL.md)
> Dùng workflow `/scaffold_module` để tạo module tự động theo đúng chuẩn.

---

## Kiến trúc tổng thể

```
app/
├── Http/
│   ├── Controllers/Api/{Module}/     ← API Controller
│   ├── Requests/{Module}/            ← Form Request Validation
│   └── Resources/{Module}/           ← JSON Resource
├── Models/{Module}/                  ← Eloquent Model
├── Policies/{Module}/                ← RBAC Policy
└── Services/{Module}/                ← Business Logic
```

---

## Quy tắc bắt buộc

### 1. Model
- Luôn dùng UUID: `HasUuids`
- Luôn scope theo org: `MultiTenant` trait
- Luôn có soft delete: `SoftDeletes`
- Fillable phải khai báo tường minh

```php
class Invoice extends Model {
    use HasUuids, MultiTenant, SoftDeletes, SystemLoggable;
    protected $fillable = ['org_id', 'property_id', ...];
}
```

### 2. Policy — implements RbacModuleProvider

```php
class InvoicePolicy implements RbacModuleProvider {
    public static function getModuleName(): string { return 'Invoices'; }
    
    public static function getRolePermissions(): array {
        return [
            'Owner'   => 'CRUD',
            'Manager' => 'CRU',
            'Staff'   => 'R',
            // Không đặt 'Tenant' nếu muốn xử lý riêng trong method
        ];
    }
}
```

**Permissions được auto-generate từ getRolePermissions():**
- `C` → `create {Module}`
- `R` → `view {Module}` + `viewAny {Module}`
- `U` → `update {Module}`
- `D` → `delete {Module}`

### 3. Service — cấu trúc chuẩn

```php
class InvoiceService {
    public function paginate(Request $request): LengthAwarePaginator {
        $query = QueryBuilder::for(Invoice::class)
            ->allowedFilters([...])
            ->allowedSorts([...])
            ->allowedIncludes([...]);
        
        // Tenant scoping
        if (auth()->user()->hasRole('Tenant')) {
            $query->whereHas('contract.members', ...);
        }
        
        return $query->paginate($request->per_page ?? 15);
    }
}
```

### 4. Controller — cấu trúc chuẩn

```php
#[Group('Module Name')]
class InvoiceController extends Controller {
    public function index(IndexRequest $request) {
        $this->authorize('viewAny', Invoice::class);
        return InvoiceResource::collection($this->service->paginate($request));
    }
    
    public function store(StoreRequest $request) {
        $this->authorize('create', Invoice::class);
        $invoice = $this->service->store($request->validated());
        return new InvoiceResource($invoice);
    }
    // ...
}
```

### 5. Routes — cấu trúc chuẩn

```php
// Trong group auth:sanctum
Route::get('{resource}/trash', [Controller::class, 'trash']);
Route::apiResource('{resource}', Controller::class);
Route::post('{resource}/{id}/restore', [Controller::class, 'restore']);
Route::delete('{resource}/{id}/force', [Controller::class, 'forceDelete']);
```

---

## Checklist tạo module mới

- [ ] Migration với uuid, org_id, softDeletes, timestamps
- [ ] Model với đúng traits (HasUuids, MultiTenant, SoftDeletes)
- [ ] Policy implement RbacModuleProvider + getRolePermissions()
- [ ] Service với paginate() + CRUD + Tenant scope (nếu cần)
- [ ] Form Requests (Index, Store, Update)
- [ ] Resource với đầy đủ fields (không dùng parent::toArray)
- [ ] Controller với Scramble #[Group] annotation
- [ ] Routes đăng ký trong api.php
- [ ] Policy đăng ký trong AuthServiceProvider
- [ ] `php artisan db:seed --class=RbacSeeder`
- [ ] Viết Feature Test (minimum 3 cases)
- [ ] Tạo docs/modules/NN_{module}.md

---

## Tenant Scoping Pattern

Khi module cần Tenant access nhưng phải giới hạn theo hợp đồng:

```php
// Trong Service.paginate()
if ($user->hasRole('Tenant')) {
    $query->whereHas('contracts', function ($q) use ($user) {
        $q->where('status', 'ACTIVE')
          ->whereHas('members', function ($sq) use ($user) {
              $sq->where('user_id', $user->id)->where('status', 'APPROVED');
          });
    });
    return $query->paginate(15);
}
```

---

## Công cụ & Packages

| Package | Tác dụng |
|---------|---------|
| `spatie/laravel-query-builder` | Filter, Sort, Include cho API |
| `spatie/laravel-permission` | RBAC roles & permissions |
| `spatie/laravel-medialibrary` | Upload & quản lý file |
| `spatie/laravel-activitylog` | Audit log tự động |
| `dedoc/scramble` | Auto-generate API docs |
| `laravel/fortify` | Auth, 2FA, profile |
| `laravel/sanctum` | API token authentication |
