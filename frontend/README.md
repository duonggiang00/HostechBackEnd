- Front-end:

* Sử dụng tailwindcss
* Sử dụng zustand quản lý state global
* Sử dụng antd
* Sử dụng tanstack Query để call Api
* Sử dụng zod để validate
* Sử dụng cloudinary để quản lý hình ảnh
* folder và tên component sử dụng PascalCase
* Tên biến đặt camelCase

- Phân chia cấu chúc thư mục trong src

* src: folder chứa toàn bộ code
* Api: Sử dụng một Axios instance được cấu hình sẵn `baseURL` để thực hiện các HTTP request đến backend API.
* Components: Các React component chịu trách nhiệm hiển thị giao diện người dùng.
* Constants: Sử lý các dữ liệu dùng chung cache và format code
* Layouts: Chứa layout chính của admin, staff và user
* Libs: Chứa thông tin validate hoặc các thư viện dùng chung
* pages: Chứa thông tin các trang của admin, staff và user
* Services: Quản lý call Api
* Store: Quản lý state global các state dùng nhiều lần
* Types: Chứa dữu liệu của interface và type
* App.tsx: Chứa router đường dẫn code
