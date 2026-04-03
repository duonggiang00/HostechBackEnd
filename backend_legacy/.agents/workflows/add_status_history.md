---
description: Tự động hóa việc tạo bảng và logic lịch sử trạng thái cho một Model
---
# Workflow Thêm Lịch sử Trạng thái (Add Status History)

Khi nhận lệnh `/add_status_history {ModelName}`, thực hiện các bước sau:

// turbo-all

## Bước 1: Tạo Migration cho bảng History
Chạy lệnh: `php artisan make:migration create_{table_name}_status_histories_table`

Cấu trúc schema yêu cầu:
- `id` (uuid, primary)
- `org_id` (uuid, index)
- `{model}_id` (uuid, index, foreign key)
- `from_status` (string, nullable)
- `to_status` (string)
- `reason` (text, nullable)
- `changed_by_user_id` (uuid, nullable, foreign key users)
- `timestamps()`

## Bước 2: Tạo Model History
Tạo file tại `app/Models/{Domain}/{ModelName}StatusHistory.php`.
- Phải có các Traits: `HasUuids`, `MultiTenant`.
- Định nghĩa quan hệ `belongsTo` với Model cha và User thực hiện.

## Bước 3: Cập nhật Model cha
- Thêm quan hệ `hasMany` tới bảng History mới tạo.
- (Tùy chọn) Thêm trait `SystemLoggable`.

## Bước 4: Tích hợp vào Service Layer
- Tìm phương thức cập nhật trạng thái trong Service tương ứng.
- Thêm logic ghi log vào bảng History ngay sau khi cập nhật thành công Model cha (nên đặt trong `DB::transaction`).

## Bước 5: Cập nhật API Resource
- Thêm quan hệ `status_histories` vào Resource của Model cha nếu cần hiển thị dòng thời gian ở Frontend.
