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
    use HandlesOrgScope;

    public static function getModuleName(): string { return 'Invoices'; }
    
    public static function getRolePermissions(): array {
        return [
            'Owner'   => 'CRUD',
            'Manager' => 'CRU',
            'Staff'   => 'R',
            'Tenant'  => 'R',
        ];
    }

    public function view(User $user, Invoice $invoice): bool {
        // Scoping Pattern
        if ($user->hasPermissionTo('view Invoices') && ! $user->hasRole('Tenant')) {
             return $this->checkOrgScope($user, $invoice);
        }
        return $invoice->contract?->members()->where('user_id', $user->id)->exists();
    }
}
```

**Permissions được auto-generate từ getRolePermissions():**
- `C` → `create {Module}`
- `R` → `view {Module}` + `viewAny {Module}`
- `U` → `update {Module}`
- `D` → `delete {Module}`

### 3. Service — cấu trúc chuẩn (Consolidated Logic)

```php
class InvoiceService {
    public function paginate(Request $request): LengthAwarePaginator {
        $query = QueryBuilder::for(Invoice::class)
            ->allowedFilters([...]);
        
        // Membership-based scoping for Tenant
        if (auth()->user()->hasRole('Tenant')) {
            $query->whereHas('contract.members', function($q) {
                $q->where('user_id', auth()->id())->where('status', 'APPROVED');
            });
        }
        
        return $query->paginate($request->per_page ?? 15);
    }

    public function processStatus(Invoice $invoice, string $newStatus, User $performer): void {
        // Business logic consolidated in Service
        $invoice->update(['status' => $newStatus]);
    }
}
```

### 4. Controller — Nguyên tắc Thin Controller

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

    public function update(UpdateRequest $request, Invoice $invoice) {
        $this->authorize('update', $invoice);
        // Dùng abort() cho lỗi nghiệp vụ
        if ($invoice->isPaid()) abort(422, 'Cannot update paid invoice');
        
        $this->service->update($invoice, $request->validated());
        return new InvoiceResource($invoice);
    }
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

## Scoping Pattern (Bắt buộc)

Dự án áp dụng mô hình cô lập dữ liệu (Multi-tenant isolation) như sau:

1. **Manager/Staff**: Truy cập toàn bộ Org dựa trên Permission (`view module`) + Trait `HandlesOrgScope`.
2. **Tenant**: Truy cập dựa trên **Membership** (ví dụ: là thành viên trong Hợp đồng của phòng đó).

**Trong Service:**
```php
if ($user->hasRole('Tenant')) {
    $query->whereHas('contract.members', function ($sq) use ($user) {
        $sq->where('user_id', $user->id)->where('status', 'APPROVED');
    });
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
