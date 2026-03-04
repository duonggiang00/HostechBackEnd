# FRONTEND ARCHITECTURE & GUIDELINES

Tài liệu này định nghĩa kiến trúc chuẩn và các nguyên tắc lập trình áp dụng cho Frontend của dự án Hostech.

## 1. Công nghệ (Tech Stack)

Frontend Hostech được xây dựng trên bộ khung hiện đại:
- **Core:** React 19, TypeScript
- **Build Tool:** Vite
- **UI & Styling:** Ant Design (antd) + TailwindCSS v4
- **State Management:** Zustand (Global UI State) + TanStack React Query (Server State)
- **Routing:** React Router v7
- **Form Handling:** React Hook Form
- **HTTP Client:** Axios

## 2. Cấu trúc thư mục (Folder Structure)

Chúng ta sử dụng cấu trúc **Feature-based** (dựa trên tính năng/module) để tổ chức code, giúp scale dự án dễ dàng khi số lượng module tăng (tương đương với các module ở backend).

```text
src/
├── app/                  # Chứa cấu hình khởi tạo (App, router registry, config toàn cục)
├── assets/               # Hình ảnh, fonts, icons tĩnh
├── features/             # (QUAN TRỌNG TỐI THƯỢNG) Chứa logic ứng dụng chia theo module nghiệp vụ
│   ├── auth/             # vd: Module xác thực (Authentication)
│   │   ├── api/          # Các hàm axios gọi API đặc thù (userApi.ts, authApi.ts)
│   │   ├── components/   # Các UI Component chỉ xuất hiện trong auth (LoginBox, VerifyOTP)
│   │   ├── hooks/        # Cụm useQuery, useMutation liên quan auth
│   │   ├── pages/        # File UI Container cấu thành Trang Router (LoginPage)
│   │   ├── types/        # Định nghĩa interface / type của entities auth
│   │   └── stores/       # Zustand slice đặc thù của tính năng (nếu có state phức tạp)
│   ├── invoices/         # Module Hóa đơn
│   ├── contracts/        # Module Hợp đồng
│   ├── properties/       # Module Khu nhà
│   ├── services/         # Module Dịch vụ
│   ├── meters/           # Module Điện nước
│   └── ...
├── shared/               # (QUAN TRỌNG) Chứa mã nguồn chia sẻ dùng chung giữa ≥ 2 features
│   ├── api/              # Cấu hình API Client dùng chung (axios interceptor)
│   ├── components/       # Các UI Component dùng chung (Global) (VD: CustomButton, Table)
│   ├── hooks/            # Global Hooks (useWindowSize, useTheme, ...)
│   ├── layouts/          # Chứa các bộ khung trang định tuyến (MainLayout, AuthLayout)
│   ├── types/            # Định nghĩa Interface/Type dùng chung (Pagination, API Response)
│   └── utils/            # Các hàm Helper tiện ích format date, xử lý chuỗi...
├── stores/               # Global Zustand Stores (VD: AppStore quản lý Sidebar, Settings)
├── index.css             # Tailwind directives & CSS base variables
└── main.tsx              # Entry point React
```

## 3. Quy chuẩn Lập trình (Coding Conventions)

### 3.1 Fetch Data và Caching
**Bắt buộc sử dụng TanStack React Query** để gọi API. Không sử dụng `useEffect` kết hợp `useState` để xử lý fetch data từ backend.
- Phân tách logic gọi API vào file `api.ts` riêng trong từng feature.
- Tạo custom hook trong thư mục `hooks/` của feature đó. Ví dụ: `useInvoices.ts` (gọi `useQuery`), `useCreateInvoice.ts` (gọi `useMutation`).

### 3.2 State Management
- **Zustand:** Chỉ dùng để lưu trữ trạng thái giao diện (UI state) hoặc những thứ global không nằm trên server. Ví dụ: Trạng thái mở/đóng Sidebar, Tenant ID đang được chọn, Theme.
- **Nghiêm cấm** lưu trữ dữ liệu trả về từ API vào Zustand trừ khi có lý do rất đặc biệt (cần cache vĩnh viễn không phụ thuộc React Query).

### 3.3 UI và Styling
- Ưu tiên sử dụng các Component có sẵn của **Ant Design** (Table, Form, Input, Select, Modal,...).
- Layout và định vị (margin, padding, flex, grid): Ưu tiên sử dụng **Tailwind CSS**.
- Việc kết hợp: Dùng className của Tailwind ghi đè hoặc tùy chỉnh spacing cho các component của Ant Design. Không viết thêm custom CSS vào `.css` ngoại trừ các biến (variables) căn bản.

### 3.4 Form Handling
- Mọi form tương tác với API (tạo mới, sửa) phải dùng **React Hook Form**.
- Tích hợp rhm với Ant Design component (như Input, Select) thông qua thẻ `<Controller>` để tối ưu performance (tránh re-render toàn form khi gõ ký tự).

### 3.5 Routing & Phân quyền (RBAC)
- Khai báo route bằng chuẩn mới của React Router v7.
- Tạo một component `<ProtectedRoute />` hoặc Higher-Order Component để bọc các route cần đăng nhập.
- Trên giao diện, sử dụng định dạng custom permission để ẩn/hiện nút (VD: Nếu user không có role Manager, ẩn nút "Xóa hóa đơn").

## 4. Checklist triển khai Module mới trên Frontend

Khi Backend có một module mới, Frontend cần thực hiện:

1. [ ] Cập nhật Type ở `src/features/{module}/types/`.
2. [ ] Viết hàm gọi API ở `src/features/{module}/api/{module}Api.ts`.
3. [ ] Tạo custom Hooks React Query ở `src/features/{module}/hooks/`.
4. [ ] Tạo giao diện List/Form/Detail ở `src/features/{module}/pages/`.
5. [ ] Tích hợp Route mới vào `src/app/routes.tsx` (hoặc nơi cấu hình định tuyến).
6. [ ] Đảm bảo gán route vào `MainLayout` và có hiển thị trên Sidebar menu.
