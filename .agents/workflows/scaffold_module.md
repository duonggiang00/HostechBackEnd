---
description: Khởi tạo bộ khung chuẩn cho một Module/Domain mới
---
# Workflow Khởi tạo khung Module (Scaffold Module)

Khi user yêu cầu tạo một Module/Domain mới (Ví dụ: `Contract`), hãy thực thi tuần tự các lệnh sau. Bổ sung chữ `Contract` thay bằng tên Module mà user yêu cầu.

// turbo-all
1. Tạo Model kèm Migration và Factory:
`php artisan make:model {{ModuleName}}\{{ModelName}} -mf`

2. Tạo các Form Requests chuẩn:
`php artisan make:request {{ModuleName}}/{{ModelName}}StoreRequest`
`php artisan make:request {{ModuleName}}/{{ModelName}}UpdateRequest`
`php artisan make:request {{ModuleName}}/{{ModelName}}IndexRequest`

3. Tạo Resource chuẩn:
`php artisan make:resource {{ModuleName}}/{{ModelName}}Resource`

4. Tạo API Controller:
`php artisan make:controller Api/{{ModuleName}}/{{ModelName}}Controller --api`

5. Tạo khung Service thủ công (tự gen bằng code block thay cho command, vì artisan không có sẵn `make:service` mặc định). File `app/Services/{{ModuleName}}/{{ModelName}}Service.php`.

6. Kiểm tra lại thư mục và đảm bảo mọi file nằm đúng chuẩn Domain-Driven.

7. Nhắc nhở người dùng cần thiết lập các Rules validation trong Request, điền code Logic vào Service và Migration.
