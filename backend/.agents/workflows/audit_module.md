---
description: Rà soát module so với tiêu chuẩn kiến trúc dự án
---
# Workflow Rà soát Module (Audit Module)

Khi nhận lệnh `/audit_module {Domain}`, hãy thực hiện các bước kiểm tra chuyên sâu sau:

## Bước 1: Kiểm tra Model
- Đảm bảo Model nằm trong namespace đúng (`App\Models\{Domain}`).
- Kiểm tra các Traits bắt buộc: `HasUuids`, `MultiTenant`, `SoftDeletes`.
- Đảm bảo khóa chính `id` có `$incrementing = false` và `$keyType = 'string'`.
- **Laravel 12 Standard**: Đảm bảo sử dụng phương thức `protected function casts(): array` (Tuyệt đối không dùng mảng thuộc tính `protected $casts = []`).

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
- **Thin Controller (Nghiêm ngặt)**: 
  - Không chứa logic nghiệp vụ, rẽ nhánh phức tạp.
  - Không tiêm `org_id` hay sửa `$request->merge(...)` ở Controller, logic này phải nằm ở Service.
- **PSR-12 (Namespaces)**: Bắt buộc import bằng lệnh `use` ở đầu file. **NGHIÊM CẤM** viết Fully Qualified Class Name trực tiếp trong tham số hoặc return type của hàm (VD: cấm viết `public function index(): \Illuminate\Http\Resources\Json\AnonymousResourceCollection`).
- **Error Handling**: Yêu cầu bắt buộc sử dụng `abort(4xx, 'message')`. **NGHIÊM CẤM** dùng `return response()->json(..., 4xx/5xx)` để ném lỗi ở Controller.
- **Scramble Docs**: Mọi `IndexRequest` PHẢI có class-level DocBlock chứa đầy đủ `@queryParam` cho: `per_page`, `page`, `search`, `with_trashed`, `sort`, và tất cả các `filter[...]` được hỗ trợ. Cấm viết `@queryParam` trong nội dung hàm của Controller.

## Bước 5: Kiểm tra Routes
- Module phải có file route riêng trong `routes/api/{domain}.php`.
- Đảm bảo không viết route trực tiếp vào `routes/api.php`.

## Bước 6: Tổng hợp báo cáo
- Xuất danh sách các điểm "Đạt" và "Chưa đạt".
- Đưa ra các Code Snippets cụ thể để khắc phục lỗi.
