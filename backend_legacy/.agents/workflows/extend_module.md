---
description: Mở rộng chức năng cho một module đã tồn tại (Extend an existing module)
---

# /extend_module — Mở rộng chức năng Module

Quy trình chuẩn khi cần thêm tính năng, trường dữ liệu hoặc logic mới vào một module đã có sẵn.

## Bước 1: Phân tích & Đánh giá (Pre-check)
Trước khi thay đổi, hãy rà soát module hiện tại bằng `/audit_module {Domain}`. 
- Xác định các file bị ảnh hưởng: Model, Service, Policy, Controller.
- Đảm bảo module hiện tại đã đạt chuẩn kiến trúc trước khi mở rộng.

## Bước 2: Cập nhật Cấu trúc DB
Nếu tính năng mới yêu cầu thêm dữ liệu:
- **Thêm cột**: Tạo migration mới `add_{fields}_to_{table}_table`.
- **Bảng mới**: Tuân thủ quy tắc UUID, org_id, SoftDeletes trong migration mới.
- Chạy `php artisan migrate`.

## Bước 3: Cập nhật Model
- **Traits**: Đảm bảo vẫn giữ `HasUuids`, `MultiTenant`, `SoftDeletes`.
- **Casts (Laravel 12 Standard)**: Đảm bảo sử dụng phương thức `protected function casts(): array` (Chuyển đổi nếu Model đang dùng thuộc tính mảng `$casts` lỗi thời).
- **Relationships**: Thêm các quan hệ mới nếu có bảng mới liên quan. Dùng return type hint cụ thể (ví dụ: `HasMany`, `BelongsTo`).

## Bước 4: Mở rộng Service Layer
**Nguyên tắc**: Không bao giờ viết logic mới trực tiếp vào Controller.
- Thêm phương thức mới vào `app/Services/{Domain}/{Model}Service.php`.
- Nếu logic cũ cần thay đổi, hãy refactor thay vì copy-paste.
- Tận dụng `DB::transaction()` nếu tác động nhiều bảng.

## Bước 5: Cập nhật Policy & RBAC
Nếu endpoint mới yêu cầu quyền mới:
- Cập nhật `getRolePermissions()` trong Policy của module.
- Chạy `php artisan db:seed --class=RbacSeeder` để cập nhật permissions vào DB.
- Đảm bảo logic scoping (Membership/Org) vẫn được áp dụng chặt chẽ cho method mới.

## Bước 6: API Layer (Requests & Resources)
- **FormRequests**: Tạo mới Request cho endpoint mới. Đừng dùng chung `StoreRequest` nếu logic validation khác nhau.
- **Scramble Docs**: Luôn thêm DocBlock `@bodyParam` hoặc `@queryParam` tại class level của Request mới.
- **Resources**: Cập nhật `toArray()` của Resource hiện tại nếu có thêm fields mới cần trả về.

## Bước 7: Controller Refinement
- Thêm method mới vào Controller.
- Đảm bảo Controller vẫn giữ vai trò "Thin Controller" (chỉ authorize và gọi Service, không tự tạo org_id hoặc merge biến vào Request).
- Yêu cầu bắt buộc sử dụng `abort(code, 'message')`, **nghiêm cấm** dùng `return response()->json(...)` để bắt lỗi nghiệp vụ.
- **PSR-12**: Chỉ sử dụng kiểu tên lớp ngắn gọn cùng khai báo `use` ở đầu file. Bỏ ngay các Fully Qualified Class Name inline nếu có.
- Kiểm tra Attribute `#[Group('...')]` để endpoint mới hiển thị đúng nhóm trong tài liệu.

## Bước 8: Kiểm thử & Xác minh (Verification)
- Viết thêm test cases vào file test hiện tại của module.
- Chạy toàn bộ suite: `php artisan test tests/Feature/{Domain}`.
- Xuất tài liệu: `php artisan scramble:export` và kiểm tra giao diện tài liệu API.

## Bước 9: Cập nhật Tài liệu Module
- Cập nhật file `docs/modules/NN_{module_name}.md`.
- Bổ sung endpoint mới vào bảng danh sách.
- Cập nhật ma trận RBAC nếu có thay đổi về quyền.
