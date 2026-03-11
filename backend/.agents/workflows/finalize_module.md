---
description: Hoàn tất module, kiểm tra cuối cùng và chuẩn bị tài liệu trước khi merge
---
# Workflow Hoàn tất Module (Finalize Module)

Khi nhận lệnh `/finalize_module {Domain}`, thực hiện chuỗi lệnh kiểm tra cuối cùng:

// turbo-all

## Bước 1: Đồng bộ Phân quyền (RBAC)
Chạy: `php artisan rbac:sync`
Đảm bảo các quyền mới định nghĩa trong Policy đã được đưa vào DB.

## Bước 2: Định dạng Code chuẩn (Pint)
Chạy: `vendor/bin/pint --dirty --format agent`
Tự động format các file đã thay đổi theo style của dự án.

## Bước 3: Chạy Tests
Chạy: `php artisan test --compact --filter={Domain}`
Đảm bảo không có lỗi regression.

## Bước 4: Kiểm tra tài liệu API
Truy cập `/docs/api` (manual) để đảm bảo Scramble đã gen đúng các annotations mới thêm.

## Bước 5: Cập nhật Tài liệu Module
- Tạo hoặc cập nhật file `docs/modules/NN_{module_name}.md`.
- Ghi chú các thay đổi quan trọng, cấu trúc bảng mới hoặc các lưu ý đặc biệt khi tích hợp.

## Bước 6: Báo cáo hoàn tất
Thông báo cho user về trạng thái cuối cùng của module.
