# TÀI LIỆU KỸ THUẬT: MODULE QUẢN LÝ HÓA ĐƠN (INVOICE API)

*Tài liệu này bao gồm Bản vẽ kiến trúc tổng thể và Hướng dẫn lập trình chi tiết từng bước cho Module Hóa đơn (Billing & Invoice), tuân thủ mô hình Domain-Driven Directory Structuring & Service Layer Pattern.*

---

## PHẦN 1: BẢN VẼ KIẾN TRÚC & DIỄN GIẢI LUỒNG DỮ LIỆU

### 1.1. Danh sách các File cần tạo (Domain: `Invoice`)
Để hoàn thiện khối backend (API) cho Hóa đơn, chúng ta cần tạo các file sau, đặt tất cả vào thư mục con `Invoice/`:
- **Controllers:**
  - `app/Http/Controllers/Api/Invoice/InvoiceController.php` (Xử lý HTTP Request cho Invoice)
  - `app/Http/Controllers/Api/Invoice/InvoiceItemController.php` (Xử lý các dòng chi tiết trong 1 hóa đơn)
- **Services:**
  - `app/Services/Invoice/InvoiceService.php` (Chứa Business Logic: tính tổng tiền, logic status, filter tìm kiếm)
- **Requests (Validation):**
  - `app/Http/Requests/Invoice/InvoiceIndexRequest.php` (Validate params khi GET list)
  - `app/Http/Requests/Invoice/InvoiceStoreRequest.php` (Validate tạo mới hóa đơn)
  - `app/Http/Requests/Invoice/InvoiceUpdateRequest.php` (Validate cập nhật hóa đơn)
- **Resources (Output Data):**
  - `app/Http/Resources/Invoice/InvoiceResource.php` (Định dạng JSON trả về cho Invoice)
  - `app/Http/Resources/Invoice/InvoiceItemResource.php` (Định dạng JSON cho từng dòng)
- **Policies (Dynamic RBAC):**
  - `app/Policies/Invoice/InvoicePolicy.php` (Quản lý quyền ai được Xem/Sửa/Xóa hóa đơn)

### 1.2. Xác thực và Phân quyền (Dynamic RBAC)
Lớp `InvoicePolicy` sẽ implement `RbacModuleProvider`.
Quyền hạn (Permissions) được tự động sinh ra gồm: `viewAny Invoice`, `view Invoice`, `create Invoice`, `update Invoice`, `delete Invoice`.

**Ma trận phân quyền (Role Permissions):**
- **Admin System:** Toàn quyền hệ thống.
- **Owner (Chủ nhà):** `CRUD` (Full quyền trên tất cả hóa đơn thuộc Org của mình).
- **Manager (Quản lý):** `CRUD`
- **Staff (Nhân viên):** `R` (Chỉ xem danh sách và chi tiết hóa đơn).
- **Tenant (Khách thuê):** `R` (Chỉ được xem các hóa đơn gắn với `contract_id` mà khách đó đứng tên - Sẽ cần logic check riêng trong Policy).

### 1.3. Danh sách API Endpoints (Routes)
| HTTP Method | Endpoint | Chức năng (Controller Action) |
| :--- | :--- | :--- |
| `GET` | `/api/invoices` | Danh sách Hóa đơn (Pagination, Filter, Sort, Search). |
| `POST` | `/api/invoices` | Lập hóa đơn mới (Kèm tạo luôn các `items` nếu có). |
| `GET` | `/api/invoices/{id}` | Xem chi tiết thông tin 1 hóa đơn, kèm theo mảng `items`. |
| `PUT` | `/api/invoices/{id}` | Sửa thông tin hóa đơn (Trạng thái, Due Date...). |
| `DELETE` | `/api/invoices/{id}`| Xóa mềm hóa đơn (Chỉ xóa nếu status là DRAFT). |

### 1.4. Chức năng chi tiết và Luồng Dữ liệu (Data Flow)

**A. Danh sách Hóa đơn (`GET /api/invoices`)**
- **Tính năng mở rộng (`InvoiceService::paginate`):**
  - **Search**: Tìm kiếm theo mã phòng (`room.code`).
  - **Filter**: Lọc theo `status` (DRAFT, ISSUED...), `period_start`, và `property_id`.
  - **Eager Loading**: Cần `with(['property', 'room', 'contract'])` để tránh N+1 Query.

**B. Tạo Hóa đơn (`POST /api/invoices`)**
- **Logic (`InvoiceService::create`):**
  1. Tạo bản ghi `Invoice` với trạng thái mặc định `DRAFT`.
  2. Lặp qua mảng `items` gửi lên để tạo các dòng `InvoiceItem` (Tiền phòng, điện, nước).
  3. Cộng dồn cột `amount` của các item để update tự động vào `total_amount` của Invoice.

**Dữ liệu Gửi đi (JSON Body) mẫu:**
```json
{
  "property_id": "uuid",
  "contract_id": "uuid",
  "room_id": "uuid",
  "period_start": "2023-10-01",
  "period_end": "2023-10-31",
  "due_date": "2023-10-05",
  "items": [
    {
      "type": "RENT",
      "description": "Tiền phòng tháng 10",
      "quantity": 1,
      "unit_price": 5000000,
      "amount": 5000000
    }
  ]
}
```

---
<br>

## PHẦN 2: HƯỚNG DẪN THỰC THI CHI TIẾT (STEP-BY-STEP TUTORIAL)

### Bước 1: Khởi tạo Cấu trúc File (Khung xương)
Mở Terminal và chạy các lệnh Artisan sau để sinh file đúng chuẩn vào thư mục `Invoice`:

```bash
php artisan make:class Services/Invoice/InvoiceService
php artisan make:controller Api/Invoice/InvoiceController
php artisan make:policy Invoice/InvoicePolicy --model=Invoice/Invoice
php artisan make:request Invoice/InvoiceIndexRequest
php artisan make:request Invoice/InvoiceStoreRequest
php artisan make:resource Invoice/InvoiceResource
php artisan make:resource Invoice/InvoiceItemResource
```

### Bước 2: Thiết lập Service Layer (Trái tim của Module)
Mở `app/Services/Invoice/InvoiceService.php` và code logic xử lý DB:

```php
namespace App\Services\Invoice;

use App\Models\Invoice\Invoice;
use Spatie\QueryBuilder\QueryBuilder;

class InvoiceService
{
    // 1. Hàm lấy danh sách (Hỗ trợ Filter/Sort/Search)
    public function paginate(array $filters, int $perPage, ?string $search)
    {
        $query = QueryBuilder::for(Invoice::class)
            ->allowedFilters($filters)
            ->defaultSort('-created_at')
            ->with(['org', 'property', 'contract', 'room']); // Eager loading

        if ($search) {
            $query->whereHas('room', function($q) use ($search) {
                $q->where('code', 'like', "%{$search}%");
            });
        }
        return $query->paginate($perPage)->withQueryString();
    }

    // 2. Hàm tạo mới Hóa đơn kèm Chi tiết (Invoice Items)
    public function create(array $data, array $itemsData, string $creatorId): Invoice
    {
        $data['created_by_user_id'] = $creatorId;
        $invoice = Invoice::create($data); // Tạo hóa đơn gốc

        $total = 0;
        foreach ($itemsData as $item) {
            $item['org_id'] = $data['org_id']; 
            $itemObj = $invoice->items()->create($item); // Tạo item chi tiết
            $total += $itemObj->amount; 
        }

        $invoice->update(['total_amount' => $total]); // Cập nhật tổng tiền
        return $invoice->load('items');
    }
}
```

### Bước 3: Thiết lập Form Requests (Gác cổng Data)
Mở `app/Http/Requests/Invoice/InvoiceStoreRequest.php` để validate dữ liệu từ Frontend:

```php
namespace App\Http\Requests\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class InvoiceStoreRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'property_id' => ['required', 'uuid', 'exists:properties,id'],
            'contract_id' => ['required', 'uuid', 'exists:contracts,id'],
            'room_id'     => ['required', 'uuid', 'exists:rooms,id'],
            'period_start'=> ['required', 'date'],
            'period_end'  => ['required', 'date', 'after:period_start'],
            'due_date'    => ['required', 'date'],
            
            // Validate mảng chi tiết
            'items'       => ['required', 'array', 'min:1'],
            'items.*.type'=> ['required', 'in:RENT,SERVICE,PENALTY,DISCOUNT'],
            'items.*.description' => ['required', 'string'],
            'items.*.quantity'    => ['required', 'numeric', 'min:0'],
            'items.*.unit_price'  => ['required', 'numeric'],
            'items.*.amount'      => ['required', 'numeric'],
        ];
    }
}
```

### Bước 4: Thiết lập Policy & RBAC (Quyền hạn)
Mở `app/Policies/Invoice/InvoicePolicy.php`. Đóng vai trò kiểm tra ai được xem/sửa hóa đơn.

```php
namespace App\Policies\Invoice;

use App\Contracts\RbacModuleProvider;
use App\Models\Invoice\Invoice;
use App\Models\Org\User;
use App\Traits\HandlesOrgScope;

class InvoicePolicy implements RbacModuleProvider
{
    use HandlesOrgScope;

    public static function getModuleName(): string { return 'Invoice'; }

    public static function getRolePermissions(): array
    {
        return [
            'Owner'   => 'CRUD', 
            'Manager' => 'CRUD', 
            'Staff'   => 'R',    
            'Tenant'  => 'R',    // Cần check logic riêng cho Khách Thuê
        ];
    }

    public function view(User $user, Invoice $invoice): bool
    {
        // Khách thuê (Tenant) chỉ xem Hóa đơn thuộc Hợp đồng của họ
        if ($user->hasRole('Tenant')) {
            return $invoice->contract->user_id === $user->id;
        }

        if (! $user->hasPermissionTo('view Invoice')) return false;
        return $this->checkOrgScope($user, $invoice); // Chặn xem chéo Cty
    }
    // ... các hàm create, update, delete tương tự
}
```
*Lưu ý: Sau khi code xong Policy, chạy `php artisan rbac:sync` để hệ thống cập nhật Database.*

### Bước 5: Controller (Lễ Tân / API)
Mở `app/Http/Controllers/Api/Invoice/InvoiceController.php`:

```php
namespace App\Http\Controllers\Api\Invoice;

use App\Http\Controllers\Controller;
use App\Http\Requests\Invoice\InvoiceStoreRequest;
use App\Http\Resources\Invoice\InvoiceResource;
use App\Models\Invoice\Invoice;
use App\Services\Invoice\InvoiceService;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;

class InvoiceController extends Controller
{
    public function __construct(protected InvoiceService $service) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $filters = ['status', AllowedFilter::exact('property_id'), AllowedFilter::exact('room_id')];

        $paginator = $this->service->paginate(
            $filters, 
            $request->query('per_page', 15), 
            $request->input('search')
        );

        return InvoiceResource::collection($paginator);
    }

    public function store(InvoiceStoreRequest $request)
    {
        $this->authorize('create', Invoice::class);

        $data = $request->except('items');
        $itemsData = $request->input('items', []);
        $data['org_id'] = auth()->user()->org_id; 

        $invoice = $this->service->create($data, $itemsData, auth()->id());
        return new InvoiceResource($invoice);
    }
}
```

### Bước 6: API Resource (Định dạng JSON Trả về)
Mở `app/Http/Resources/Invoice/InvoiceResource.php`:

```php
namespace App\Http\Resources\Invoice;

use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'period' => "{$this->period_start} đến {$this->period_end}",
            'status' => $this->status,
            'amount' => [
                'total' => (float) $this->total_amount,
                'paid'  => (float) $this->paid_amount,
                'debt'  => (float) ($this->total_amount - $this->paid_amount)
            ],
            'room'    => [
                'id' => $this->room->id,
                'code' => $this->room->code
            ],
            'items'   => InvoiceItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
```

### Bước 7: Đăng ký Endpoint vào Route
Thêm vào `routes/api.php`:

```php
use App\Http\Controllers\Api\Invoice\InvoiceController;

Route::middleware(['auth:sanctum'])->group(function () {
    // API Hóa đơn
    Route::apiResource('invoices', InvoiceController::class);
});
```

Chạy lệnh `php artisan optimize:clear` và bạn đã hoàn thành Module Hóa đơn.
