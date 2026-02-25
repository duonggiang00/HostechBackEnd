# INVOICE MODULE - FLOW CODE CHI TIẾT

> **Tài liệu này là bản hướng dẫn coding thực tế**, được rút ra từ việc đọc toàn bộ codebase hiện tại.
> Mỗi bước có **file path chính xác**, **code template theo đúng convention dự án**, và **checklist kiểm tra**.

---

## 📊 Tổng quan: Những gì ĐÃ CÓ vs CẦN TẠO

### ✅ Đã có sẵn (KHÔNG cần code lại):
| File | Trạng thái |
|------|-----------|
| `database/migrations/2026_02_24_122540_create_invoices_and_invoice_items_tables.php` | ✅ Đã tạo |
| `app/Models/Invoice/Invoice.php` | ✅ Đã tạo (fillable, casts, relationships) |
| `app/Models/Invoice/InvoiceItem.php` | ✅ Đã tạo |

### 🔨 Cần tạo mới (7 files):
| # | File cần tạo | Mục đích |
|---|-------------|----------|
| 1 | `app/Policies/Invoice/InvoicePolicy.php` | Phân quyền RBAC |
| 2 | `app/Services/Invoice/InvoiceService.php` | Business logic + DB queries |
| 3 | `app/Http/Requests/Invoice/InvoiceStoreRequest.php` | Validate tạo mới |
| 4 | `app/Http/Requests/Invoice/InvoiceUpdateRequest.php` | Validate cập nhật |
| 5 | `app/Http/Resources/Invoice/InvoiceResource.php` | Format JSON output |
| 6 | `app/Http/Resources/Invoice/InvoiceItemResource.php` | Format JSON output items |
| 7 | `app/Http/Controllers/Api/Invoice/InvoiceController.php` | HTTP endpoint handler |

### 📝 Cần sửa (1 file):
| File | Nội dung sửa |
|------|-------------|
| `routes/api.php` | Thêm routes cho Invoice |

---

## BƯỚC 0: KHỞI TẠO FILE BẰNG ARTISAN

Mở terminal tại thư mục `d:\laravel-projects\HostechBackEnd` và chạy lần lượt:

```bash
# Policy
php artisan make:policy Invoice/InvoicePolicy --model=Invoice/Invoice

# Service (tạo class trống)
php artisan make:class Services/Invoice/InvoiceService

# Form Requests
php artisan make:request Invoice/InvoiceStoreRequest
php artisan make:request Invoice/InvoiceUpdateRequest

# API Resources
php artisan make:resource Invoice/InvoiceResource
php artisan make:resource Invoice/InvoiceItemResource

# Controller
php artisan make:controller Api/Invoice/InvoiceController
```

> ⚠️ **Sau khi tạo xong, xóa hết nội dung mặc định** trong các file và code lại theo hướng dẫn bên dưới.

---

## BƯỚC 1: POLICY — Phân quyền (RBAC)

**File:** `app/Policies/Invoice/InvoicePolicy.php`

**Vai trò:** Đăng ký module Invoice vào hệ thống RBAC + kiểm tra quyền cho từng action.

**Convention dự án:**
- `implements RbacModuleProvider` → để `php artisan rbac:sync` auto-detect
- `use HandlesOrgScope` → check chéo org
- `use HandlesAuthorization` → trait chuẩn Laravel
- Permission name format: `'{action} {ModuleName}'` (ví dụ: `'viewAny Invoice'`)

```php
<?php

namespace App\Policies\Invoice;

use App\Contracts\RbacModuleProvider;
use App\Models\Invoice\Invoice;
use App\Models\Org\User;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class InvoicePolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesOrgScope;

    // ╔═══════════════════════════════════════════════════════╗
    // ║  RBAC MODULE REGISTRATION                            ║
    // ╠═══════════════════════════════════════════════════════╣
    
    /**
     * Tên module → sẽ sinh permissions: viewAny Invoice, view Invoice, create Invoice, ...
     */
    public static function getModuleName(): string
    {
        return 'Invoice';
    }

    /**
     * Ma trận quyền theo role.
     * 
     * 'CRUD' = Create + Read (viewAny, view) + Update + Delete
     * 'R'    = Read only (viewAny, view)
     * 'RU'   = Read + Update
     * 
     * Shorthand mapping (xem app/Enums/RbacAction.php):
     *   C → create
     *   R → viewAny + view  
     *   U → update
     *   D → delete
     */
    public static function getRolePermissions(): array
    {
        return [
            'Owner'   => 'CRUD',   // Full quyền
            'Manager' => 'CRUD',   // Full quyền  
            'Staff'   => 'R',      // Chỉ xem danh sách + chi tiết
            'Tenant'  => 'R',      // Chỉ xem (logic riêng: chỉ thấy hóa đơn của mình)
        ];
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  POLICY METHODS (Kiểm tra quyền runtime)             ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Xem DANH SÁCH hóa đơn?
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny Invoice');
    }

    /**
     * Xem CHI TIẾT 1 hóa đơn?
     * 
     * Tenant: chỉ xem hóa đơn thuộc hợp đồng của mình.
     * Các role khác: check permission + org scope.
     */
    public function view(User $user, Invoice $invoice): bool
    {
        // Tenant → chỉ xem hóa đơn gắn với contract mà họ là thành viên
        if ($user->hasRole('Tenant')) {
            return $invoice->contract
                && $invoice->contract->members()
                    ->where('user_id', $user->id)
                    ->exists();
        }

        if (! $user->hasPermissionTo('view Invoice')) {
            return false;
        }

        return $this->checkOrgScope($user, $invoice);
    }

    /**
     * TẠO hóa đơn?
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Invoice');
    }

    /**
     * CẬP NHẬT hóa đơn?
     */
    public function update(User $user, Invoice $invoice): bool
    {
        if (! $user->hasPermissionTo('update Invoice')) {
            return false;
        }
        return $this->checkOrgScope($user, $invoice);
    }

    /**
     * XÓA MỀM hóa đơn?
     * Lưu ý nghiệp vụ: chỉ xóa được khi status = DRAFT
     */
    public function delete(User $user, Invoice $invoice): bool
    {
        if (! $user->hasPermissionTo('delete Invoice')) {
            return false;
        }
        return $this->checkOrgScope($user, $invoice);
    }

    /**
     * KHÔI PHỤC hóa đơn đã xóa mềm?
     */
    public function restore(User $user, Invoice $invoice): bool
    {
        if (! $user->hasPermissionTo('delete Invoice')) {
            return false;
        }
        return $this->checkOrgScope($user, $invoice);
    }

    /**
     * XÓA VĨNH VIỄN?
     */
    public function forceDelete(User $user, Invoice $invoice): bool
    {
        if (! $user->hasPermissionTo('delete Invoice')) {
            return false;
        }
        return $this->checkOrgScope($user, $invoice);
    }
}
```

### ✅ Checklist Bước 1:
- [ ] File implement `RbacModuleProvider`
- [ ] `getModuleName()` trả về `'Invoice'`
- [ ] `getRolePermissions()` đã khai báo cho Owner, Manager, Staff, Tenant
- [ ] Các method `viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete` đã có
- [ ] `view()` có logic riêng cho Tenant
- [ ] Tất cả method check model đều gọi `$this->checkOrgScope()`

---

## BƯỚC 2: SERVICE LAYER — Business Logic

**File:** `app/Services/Invoice/InvoiceService.php`

**Vai trò:** Chứa toàn bộ logic truy vấn DB, tính toán nghiệp vụ. Controller chỉ gọi Service.

**Convention dự án (tham khảo `ContractService.php`):**
- Dùng `Spatie\QueryBuilder` cho `paginate()`
- Dùng `DB::transaction()` cho `create()` khi có items con
- Có đủ: `paginate`, `paginateTrash`, `find`, `findTrashed`, `create`, `update`, `delete`, `restore`, `forceDelete`

```php
<?php

namespace App\Services\Invoice;

use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class InvoiceService
{
    // ╔═══════════════════════════════════════════════════════╗
    // ║  READ OPERATIONS                                      ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Danh sách hóa đơn (pagination + filter + sort + search).
     */
    public function paginate(
        array $allowedFilters = [],
        int $perPage = 15,
        ?string $search = null,
        ?string $orgId = null
    ) {
        $query = QueryBuilder::for(Invoice::class)
            ->allowedFilters(array_merge($allowedFilters, [
                AllowedFilter::exact('org_id'),
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('contract_id'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('status'),
            ]))
            ->allowedSorts([
                'due_date', 'period_start', 'period_end',
                'total_amount', 'status', 'created_at',
            ])
            ->defaultSort('-created_at')
            ->with(['property', 'room', 'contract', 'items']);

        // Lọc theo org (non-Admin users)
        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        // Tìm kiếm theo mã phòng hoặc tên property
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('room', function ($rq) use ($search) {
                    $rq->where('code', 'like', "%{$search}%")
                       ->orWhere('name', 'like', "%{$search}%");
                })
                ->orWhereHas('property', function ($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%");
                });
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Danh sách hóa đơn đã xóa mềm (thùng rác).
     */
    public function paginateTrash(
        array $allowedFilters = [],
        int $perPage = 15,
        ?string $search = null,
        ?string $orgId = null
    ) {
        $query = QueryBuilder::for(Invoice::onlyTrashed())
            ->allowedFilters($allowedFilters)
            ->allowedSorts(['due_date', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['property', 'room']);

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('room', fn($rq) =>
                    $rq->where('code', 'like', "%{$search}%")
                );
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Tìm 1 hóa đơn theo ID (kèm eager load).
     */
    public function find(string $id): ?Invoice
    {
        return Invoice::with([
            'property', 'room', 'contract', 'items',
            'createdBy', 'issuedBy',
        ])->find($id);
    }

    /**
     * Tìm hóa đơn đã xóa mềm.
     */
    public function findTrashed(string $id): ?Invoice
    {
        return Invoice::onlyTrashed()->with(['property', 'room'])->find($id);
    }

    /**
     * Tìm kể cả đã xóa mềm.
     */
    public function findWithTrashed(string $id): ?Invoice
    {
        return Invoice::withTrashed()->with(['property', 'room'])->find($id);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  WRITE OPERATIONS                                     ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Tạo hóa đơn mới kèm danh sách items.
     * 
     * Sử dụng DB::transaction để đảm bảo tính toàn vẹn:
     * - Tạo Invoice
     * - Tạo các InvoiceItem
     * - Tính tổng total_amount từ các items
     */
    public function create(array $data, array $itemsData = []): Invoice
    {
        return DB::transaction(function () use ($data, $itemsData) {
            // 1. Tạo hóa đơn gốc
            $invoice = Invoice::create($data);

            // 2. Tạo các dòng chi tiết (items)
            $totalAmount = 0;
            foreach ($itemsData as $item) {
                $item['org_id'] = $data['org_id'];
                $created = $invoice->items()->create($item);
                $totalAmount += $created->amount;
            }

            // 3. Cập nhật tổng tiền
            if ($totalAmount > 0) {
                $invoice->update(['total_amount' => $totalAmount]);
            }

            return $invoice->load('items');
        });
    }

    /**
     * Cập nhật hóa đơn.
     */
    public function update(string $id, array $data): ?Invoice
    {
        $invoice = $this->find($id);
        if (! $invoice) return null;

        return DB::transaction(function () use ($invoice, $data) {
            $invoice->update($data);
            return $invoice->refresh();
        });
    }

    /**
     * Xóa mềm hóa đơn.
     */
    public function delete(string $id): bool
    {
        $invoice = $this->find($id);
        if (! $invoice) return false;
        return $invoice->delete();
    }

    /**
     * Khôi phục hóa đơn đã xóa mềm.
     */
    public function restore(string $id): bool
    {
        $invoice = $this->findTrashed($id);
        if (! $invoice) return false;
        return $invoice->restore();
    }

    /**
     * Xóa vĩnh viễn.
     */
    public function forceDelete(string $id): bool
    {
        $invoice = $this->findWithTrashed($id);
        if (! $invoice) return false;
        return $invoice->forceDelete();
    }
}
```

### ✅ Checklist Bước 2:
- [ ] Có đủ: `paginate`, `paginateTrash`, `find`, `findTrashed`, `findWithTrashed`
- [ ] Có đủ: `create`, `update`, `delete`, `restore`, `forceDelete`
- [ ] `create()` dùng `DB::transaction()` để tạo Invoice + Items
- [ ] `create()` tự tính `total_amount` từ items
- [ ] `paginate()` dùng `Spatie\QueryBuilder` cho filter/sort
- [ ] Eager loading: `property`, `room`, `contract`, `items`

---

## BƯỚC 3: FORM REQUESTS — Validate dữ liệu đầu vào

### 3A. InvoiceStoreRequest

**File:** `app/Http/Requests/Invoice/InvoiceStoreRequest.php`

```php
<?php

namespace App\Http\Requests\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class InvoiceStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Policy xử lý authorization
    }

    public function rules(): array
    {
        return [
            // Liên kết bắt buộc
            'property_id'  => ['required', 'uuid', 'exists:properties,id'],
            'contract_id'  => ['required', 'uuid', 'exists:contracts,id'],
            'room_id'      => ['required', 'uuid', 'exists:rooms,id'],

            // Kỳ thanh toán
            'period_start' => ['required', 'date'],
            'period_end'   => ['required', 'date', 'after:period_start'],
            'due_date'     => ['required', 'date'],

            // Trạng thái (mặc định DRAFT nếu không gửi)
            'status'       => ['nullable', 'string', 'in:DRAFT,ISSUED,PENDING,PAID,OVERDUE,CANCELLED'],

            // Danh sách chi tiết (items) - bắt buộc ít nhất 1
            'items'               => ['required', 'array', 'min:1'],
            'items.*.type'        => ['required', 'string', 'in:RENT,SERVICE,PENALTY,DISCOUNT,ADJUSTMENT'],
            'items.*.service_id'  => ['nullable', 'uuid', 'exists:services,id'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity'    => ['required', 'numeric', 'min:0'],
            'items.*.unit_price'  => ['required', 'numeric'],
            'items.*.amount'      => ['required', 'numeric'],
            'items.*.meta'        => ['nullable', 'array'],
        ];
    }

    /**
     * Tên hiển thị các field (cho thông báo lỗi tiếng Việt).
     */
    public function attributes(): array
    {
        return [
            'property_id'          => 'Tòa nhà',
            'contract_id'          => 'Hợp đồng',
            'room_id'              => 'Phòng',
            'period_start'         => 'Ngày bắt đầu kỳ',
            'period_end'           => 'Ngày kết thúc kỳ',
            'due_date'             => 'Hạn thanh toán',
            'status'               => 'Trạng thái',
            'items'                => 'Chi tiết hóa đơn',
            'items.*.type'         => 'Loại phí',
            'items.*.description'  => 'Mô tả',
            'items.*.quantity'     => 'Số lượng',
            'items.*.unit_price'   => 'Đơn giá',
            'items.*.amount'       => 'Thành tiền',
        ];
    }
}
```

### 3B. InvoiceUpdateRequest

**File:** `app/Http/Requests/Invoice/InvoiceUpdateRequest.php`

```php
<?php

namespace App\Http\Requests\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class InvoiceUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'       => ['nullable', 'string', 'in:DRAFT,ISSUED,PENDING,PAID,OVERDUE,CANCELLED'],
            'due_date'     => ['nullable', 'date'],
            'period_start' => ['nullable', 'date'],
            'period_end'   => ['nullable', 'date', 'after:period_start'],
            'paid_amount'  => ['nullable', 'numeric', 'min:0'],
            'issue_date'   => ['nullable', 'date'],
        ];
    }

    public function attributes(): array
    {
        return [
            'status'       => 'Trạng thái',
            'due_date'     => 'Hạn thanh toán',
            'period_start' => 'Ngày bắt đầu kỳ',
            'period_end'   => 'Ngày kết thúc kỳ',
            'paid_amount'  => 'Số tiền đã trả',
            'issue_date'   => 'Ngày phát hành',
        ];
    }
}
```

### ✅ Checklist Bước 3:
- [ ] StoreRequest: validate `property_id`, `contract_id`, `room_id` (required + uuid + exists)
- [ ] StoreRequest: validate mảng `items` (required, min:1, validate từng item)
- [ ] UpdateRequest: tất cả fields đều `nullable` (partial update)
- [ ] Có `attributes()` với tên tiếng Việt

---

## BƯỚC 4: API RESOURCES — Format JSON trả về

### 4A. InvoiceItemResource

**File:** `app/Http/Resources/Invoice/InvoiceItemResource.php`

```php
<?php

namespace App\Http\Resources\Invoice;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'type'        => $this->type,
            'service_id'  => $this->service_id,
            'description' => $this->description,
            'quantity'    => (float) $this->quantity,
            'unit_price'  => (float) $this->unit_price,
            'amount'      => (float) $this->amount,
            'meta'        => $this->meta,
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}
```

### 4B. InvoiceResource

**File:** `app/Http/Resources/Invoice/InvoiceResource.php`

```php
<?php

namespace App\Http\Resources\Invoice;

use App\Http\Resources\Contract\ContractResource;
use App\Http\Resources\Property\PropertyResource;
use App\Http\Resources\Property\RoomResource;
use App\Http\Resources\Org\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'org_id'        => $this->org_id,
            'status'        => $this->status,

            // Kỳ thanh toán
            'period_start'  => $this->period_start?->format('Y-m-d'),
            'period_end'    => $this->period_end?->format('Y-m-d'),
            'issue_date'    => $this->issue_date?->format('Y-m-d'),
            'due_date'      => $this->due_date?->format('Y-m-d'),

            // Tài chính
            'total_amount'  => (float) $this->total_amount,
            'paid_amount'   => (float) $this->paid_amount,
            'debt'          => (float) ($this->total_amount - $this->paid_amount),

            // Relationships (chỉ trả khi được eager load)
            'property'      => new PropertyResource($this->whenLoaded('property')),
            'room'          => new RoomResource($this->whenLoaded('room')),
            'contract'      => new ContractResource($this->whenLoaded('contract')),
            'items'         => InvoiceItemResource::collection($this->whenLoaded('items')),

            // Người tạo / phát hành
            'created_by'    => new UserResource($this->whenLoaded('createdBy')),
            'issued_by'     => new UserResource($this->whenLoaded('issuedBy')),

            // Timestamps
            'issued_at'     => $this->issued_at?->toIso8601String(),
            'cancelled_at'  => $this->cancelled_at?->toIso8601String(),
            'created_at'    => $this->created_at?->toIso8601String(),
            'updated_at'    => $this->updated_at?->toIso8601String(),
        ];
    }
}
```

### ✅ Checklist Bước 4:
- [ ] `InvoiceResource` sử dụng `$this->whenLoaded()` cho relations
- [ ] Tất cả date fields dùng `->format('Y-m-d')` hoặc `->toIso8601String()`
- [ ] Tất cả decimal fields dùng `(float)` cast
- [ ] `debt` được tính: `total_amount - paid_amount`
- [ ] `items` dùng `InvoiceItemResource::collection()`

---

## BƯỚC 5: CONTROLLER — Xử lý HTTP Request

**File:** `app/Http/Controllers/Api/Invoice/InvoiceController.php`

**Convention dự án (tham khảo `ContractController.php`):**
- Constructor inject `InvoiceService`
- Mỗi method gọi `$this->authorize()` (Laravel Gate → Policy)
- Admin nhìn toàn hệ thống, non-Admin chỉ nhìn trong org
- Dùng Scramble `#[Group()]` cho API docs

```php
<?php

namespace App\Http\Controllers\Api\Invoice;

use App\Http\Controllers\Controller;
use App\Http\Requests\Invoice\InvoiceStoreRequest;
use App\Http\Requests\Invoice\InvoiceUpdateRequest;
use App\Http\Resources\Invoice\InvoiceResource;
use App\Models\Invoice\Invoice;
use App\Services\Invoice\InvoiceService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

/**
 * Quản lý Hóa đơn (Invoices)
 *
 * API quản lý hóa đơn thanh toán hàng tháng.
 */
#[Group('Quản lý Hóa đơn')]
class InvoiceController extends Controller
{
    public function __construct(protected InvoiceService $service) {}

    /**
     * Danh sách hóa đơn
     *
     * Lấy danh sách hóa đơn. Hỗ trợ lọc theo Property, Room, Contract, Status.
     *
     * @queryParam per_page int Số bản ghi mỗi trang. Example: 15
     * @queryParam search string Tìm kiếm theo mã phòng.
     * @queryParam filter[status] string Lọc trạng thái: DRAFT, ISSUED, PENDING, PAID, OVERDUE, CANCELLED.
     * @queryParam filter[property_id] string Lọc theo tòa nhà.
     * @queryParam filter[room_id] string Lọc theo phòng.
     * @queryParam sort string Sắp xếp: due_date, total_amount, created_at. Thêm "-" để DESC.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) $perPage = 15;

        $allowed = ['status', 'property_id', 'room_id', 'contract_id'];
        $search = $request->input('search');

        // Security: non-Admin chỉ thấy data trong org của mình
        $user = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id') : $user->org_id;

        $paginator = $this->service->paginate($allowed, $perPage, $search, $orgId);

        return InvoiceResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Danh sách hóa đơn đã xóa (Thùng rác)
     */
    public function trash(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) $perPage = 15;

        $allowed = ['status', 'property_id', 'room_id'];
        $search = $request->input('search');

        $user = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id') : $user->org_id;

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search, $orgId);

        return InvoiceResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Tạo hóa đơn mới
     *
     * Tạo hóa đơn kèm danh sách items chi tiết (tiền phòng, điện, nước, dịch vụ...).
     */
    public function store(InvoiceStoreRequest $request)
    {
        $this->authorize('create', Invoice::class);

        $data = $request->except('items');
        $itemsData = $request->input('items', []);

        // Auto-assign org_id
        $user = $request->user();
        if (! $user->hasRole('Admin') && $user->org_id) {
            $data['org_id'] = $user->org_id;
        } else {
            // Admin: lấy org_id từ room nếu không truyền
            if (! isset($data['org_id'])) {
                $room = \App\Models\Property\Room::find($data['room_id']);
                $data['org_id'] = $room?->org_id;
            }
        }

        $data['created_by_user_id'] = $user->id;
        $data['status'] = $data['status'] ?? 'DRAFT';

        $invoice = $this->service->create($data, $itemsData);

        return (new InvoiceResource($invoice))->response()->setStatusCode(201);
    }

    /**
     * Chi tiết hóa đơn
     *
     * Xem thông tin chi tiết 1 hóa đơn, bao gồm danh sách items.
     */
    public function show(string $id)
    {
        $invoice = $this->service->find($id);
        if (! $invoice) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $invoice);

        return new InvoiceResource($invoice);
    }

    /**
     * Cập nhật hóa đơn
     *
     * Cập nhật trạng thái, hạn thanh toán, số tiền đã trả...
     */
    public function update(InvoiceUpdateRequest $request, string $id)
    {
        $invoice = $this->service->find($id);
        if (! $invoice) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $invoice);

        $updated = $this->service->update($id, $request->validated());

        return new InvoiceResource($updated);
    }

    /**
     * Xóa hóa đơn (Soft Delete)
     *
     * Chỉ xóa được khi hóa đơn ở trạng thái DRAFT.
     */
    public function destroy(string $id)
    {
        $invoice = $this->service->find($id);
        if (! $invoice) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $invoice);

        // Business rule: chỉ xóa được DRAFT
        if ($invoice->status !== 'DRAFT') {
            return response()->json([
                'message' => 'Chỉ có thể xóa hóa đơn ở trạng thái Nháp (DRAFT).'
            ], 422);
        }

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    /**
     * Khôi phục hóa đơn đã xóa
     */
    public function restore(string $id)
    {
        $invoice = $this->service->findTrashed($id);
        if (! $invoice) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('restore', $invoice);

        $this->service->restore($id);

        return new InvoiceResource($invoice);
    }

    /**
     * Xóa vĩnh viễn hóa đơn
     */
    public function forceDelete(string $id)
    {
        $invoice = $this->service->findWithTrashed($id);
        if (! $invoice) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('forceDelete', $invoice);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }
}
```

### ✅ Checklist Bước 5:
- [ ] Constructor inject `InvoiceService`
- [ ] Mỗi method gọi `$this->authorize()` trước xử lý
- [ ] `index()` có logic phân biệt Admin vs non-Admin
- [ ] `store()` auto-assign `org_id` + `created_by_user_id`
- [ ] `store()` gửi `items` riêng cho Service
- [ ] `destroy()` check business rule: chỉ xóa DRAFT
- [ ] Có `trash()`, `restore()`, `forceDelete()` (theo convention dự án)
- [ ] Dùng `#[Group()]` cho Scramble API docs

---

## BƯỚC 6: ROUTES — Đăng ký API Endpoints

**File:** `routes/api.php`

**Thêm vào trong block `Route::middleware('auth:sanctum')->group()`:**

```php
use App\Http\Controllers\Api\Invoice\InvoiceController;

// Thêm vào trong group middleware auth:sanctum
// ... (các routes khác đã có) ...

// Invoices
Route::get('invoices/trash', [InvoiceController::class, 'trash']);
Route::apiResource('invoices', InvoiceController::class);
Route::post('invoices/{id}/restore', [InvoiceController::class, 'restore']);
Route::delete('invoices/{id}/force', [InvoiceController::class, 'forceDelete']);
```

**Pattern này sẽ tạo ra các endpoints:**

| HTTP Method | URL | Controller Method | Mục đích |
|-------------|-----|-------------------|----------|
| `GET` | `/api/invoices` | `index` | Danh sách |
| `POST` | `/api/invoices` | `store` | Tạo mới |
| `GET` | `/api/invoices/{id}` | `show` | Chi tiết |
| `PUT/PATCH` | `/api/invoices/{id}` | `update` | Cập nhật |
| `DELETE` | `/api/invoices/{id}` | `destroy` | Xóa mềm |
| `GET` | `/api/invoices/trash` | `trash` | Thùng rác |
| `POST` | `/api/invoices/{id}/restore` | `restore` | Khôi phục |
| `DELETE` | `/api/invoices/{id}/force` | `forceDelete` | Xóa vĩnh viễn |

### ✅ Checklist Bước 6:
- [ ] Route `trash` đặt TRƯỚC `apiResource` (tránh conflict với `{id}`)
- [ ] Tất cả routes nằm trong `middleware('auth:sanctum')`
- [ ] Có import `InvoiceController` ở đầu file

---

## BƯỚC 7: ĐỒNG BỘ RBAC & KIỂM TRA

### 7A. Thêm SoftDeletes vào Model Invoice (NẾU CHƯA CÓ)

Kiểm tra `app/Models/Invoice/Invoice.php`. Nếu chưa có `SoftDeletes`, thêm vào:

```php
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, HasUuids, MultiTenant, SystemLoggable, SoftDeletes; // ← thêm SoftDeletes
    // ...
}
```

> ⚠️ Cũng cần kiểm tra migration có `$table->softDeletes()` chưa. Nếu chưa có, tạo migration mới:
> ```bash
> php artisan make:migration add_soft_deletes_to_invoices_table
> ```

### 7B. Đồng bộ Permissions vào Database

```bash
# Chạy migration nếu có migration mới
php artisan migrate

# Đồng bộ quyền RBAC (BẮT BUỘC sau khi tạo Policy mới)
php artisan rbac:sync

# Clear cache
php artisan optimize:clear
```

### 7C. Kiểm tra kết quả

```bash
# Xem danh sách routes đã đăng ký
php artisan route:list --path=invoices

# Start server
php artisan serve
```

**Kết quả mong đợi từ `route:list`:**
```
GET|HEAD   api/invoices ..................... invoices.index
POST       api/invoices ..................... invoices.store  
GET|HEAD   api/invoices/trash .............. InvoiceController@trash
GET|HEAD   api/invoices/{invoice} .......... invoices.show
PUT|PATCH  api/invoices/{invoice} .......... invoices.update
DELETE     api/invoices/{invoice} .......... invoices.destroy
POST       api/invoices/{id}/restore ....... InvoiceController@restore
DELETE     api/invoices/{id}/force ......... InvoiceController@forceDelete
```

**Xem API docs tự động tạo bởi Scramble:**
- Truy cập: `http://127.0.0.1:8000/docs/api`

### ✅ Checklist Bước 7:
- [ ] Model Invoice có `SoftDeletes` (nếu cần trash/restore)
- [ ] Migration đã run
- [ ] `php artisan rbac:sync` thành công → tạo ra permissions: `viewAny Invoice`, `view Invoice`, `create Invoice`, `update Invoice`, `delete Invoice`, `restore Invoice`, `forceDelete Invoice`
- [ ] `php artisan route:list --path=invoices` hiển thị đủ 8 routes
- [ ] API docs Scramble hiển thị group "Quản lý Hóa đơn"

---

## 📋 TỔNG KẾT: THỨ TỰ CODE

```
Bước 0: Artisan generate files      (Terminal)
   ↓
Bước 1: InvoicePolicy               (app/Policies/Invoice/)
   ↓
Bước 2: InvoiceService              (app/Services/Invoice/)
   ↓
Bước 3: StoreRequest + UpdateRequest (app/Http/Requests/Invoice/)
   ↓
Bước 4: Resource + ItemResource     (app/Http/Resources/Invoice/)
   ↓
Bước 5: InvoiceController           (app/Http/Controllers/Api/Invoice/)
   ↓
Bước 6: routes/api.php              (routes/)
   ↓
Bước 7: rbac:sync + migrate + test  (Terminal)
```

## 🔍 CÁCH TỰ KIỂM TRA (Test nhanh bằng API)

### Test 1: Tạo hóa đơn
```bash
curl -X POST http://127.0.0.1:8000/api/invoices \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "uuid-property",
    "contract_id": "uuid-contract",
    "room_id": "uuid-room",
    "period_start": "2026-03-01",
    "period_end": "2026-03-31",
    "due_date": "2026-04-05",
    "items": [
      {
        "type": "RENT",
        "description": "Tiền thuê tháng 3",
        "quantity": 1,
        "unit_price": 5000000,
        "amount": 5000000
      },
      {
        "type": "SERVICE",
        "description": "Tiền điện",
        "quantity": 120,
        "unit_price": 3500,
        "amount": 420000
      }
    ]
  }'
```

### Test 2: Danh sách + Lọc
```bash
# Tất cả
curl -H "Authorization: Bearer {TOKEN}" http://127.0.0.1:8000/api/invoices

# Lọc theo trạng thái
curl http://127.0.0.1:8000/api/invoices?filter[status]=DRAFT

# Sắp xếp theo hạn thanh toán
curl http://127.0.0.1:8000/api/invoices?sort=-due_date

# Tìm kiếm
curl http://127.0.0.1:8000/api/invoices?search=P101
```

### Test 3: Cập nhật trạng thái → PAID
```bash
curl -X PUT http://127.0.0.1:8000/api/invoices/{id} \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status": "PAID", "paid_amount": 5420000}'
```

---

> 📌 **Ghi nhớ:** Mỗi khi tạo module mới, flow luôn là:  
> **Migration → Model → Policy → Service → Request → Resource → Controller → Route → rbac:sync**
