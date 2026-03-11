# Tiêu chuẩn thiết kế API (API Standardization)

## 1. Document API bằng Dedoc Scramble
Tất cả các Controllers API phải được nhóm lại bằng attribute `#[Group('Tên Group')]`.

### Quy chuẩn Annotations cho các Endpoint danh sách (Index)
Khi viết endpoint `index` có hỗ trợ phân trang (Pagination) và bộ lọc (Spatie QueryBuilder), **BẮT BUỘC** phải thêm các PHPDoc `@queryParam` sau đây để Dedoc nhận dạng:

```php
/**
 * Danh sách bản ghi
 * 
 * Lấy danh sách kèm bộ lọc và phân trang.
 * 
 * @queryParam per_page int Số lượng mục mỗi trang. Default: 15. Example: 10
 * @queryParam page int Số trang. Example: 1
 * @queryParam search string Tìm kiếm chung (theo name, code...). Example: keyword
 * @queryParam sort string Sắp xếp theo trường (thêm '-' để giảm dần). Default: -created_at. Example: -created_at
 * @queryParam filter[field_name] type Lọc theo trường cụ thể (nếu allowFilters hỗ trợ). Example: value
 * @queryParam with_trashed boolean Bao gồm cả các mục đã xóa tạm (Soft Deleted). Example: 1
 */
public function index(Request $request) {}
```

## 2. Validation (Form Requests)
**TUYỆT ĐỐI KHÔNG** dùng `$request->validate()` lồng bên trong Controller.
- Bắt buộc tạo và sử dụng các class FormRequest (`App\Http\Requests\Domain\XxxStoreRequest`).
- Mọi rule validation phải được mô tả bằng PHPDoc attribute `@bodyParam` bên trong FormRequest để Dedoc tự động bóc tách tài liệu.

Ví dụ:
```php
/**
 * @bodyParam name string required Tên bản ghi. Example: Nguyễn Văn A
 * @bodyParam status string Trạng thái. Example: ACTIVE
 */
class UserStoreRequest extends FormRequest {}
```

## 3. Responses (API Resources)
**TUYỆT ĐỐI KHÔNG** trả về Array thuần hay Eloquent Model trực tiếp.
- Phải sử dụng `Illuminate\Http\Resources\Json\JsonResource`.
- Các relation load thêm phải được check bằng `$this->whenLoaded('relation_name')`.
