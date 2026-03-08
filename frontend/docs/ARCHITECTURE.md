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

Chúng ta sử dụng cấu trúc **Feature-based** (dựa trên tính năng/module) để tổ chức code.

```text
src/
├── app/                  # Chứa cấu hình khởi tạo (App, router registry, config toàn cục)
├── assets/               # Hình ảnh, fonts, icons tĩnh
├── features/             # (QUAN TRỌNG) Chứa logic ứng dụng chia theo module nghiệp vụ
│   ├── {feature_name}/   
│   │   ├── api/          # Các hàm axios gọi API đặc thù
│   │   ├── components/   # Các UI Component đặc thù của feature
│   │   ├── hooks/        # Cụm useQuery, useMutation
│   │   ├── pages/        # Các trang (Route components)
│   │   ├── types/        # Định nghĩa interface / type
│   │   └── stores/       # Zustand slice đặc thù (nếu có)
├── shared/               # Chứa mã nguồn chia sẻ dùng chung
│   ├── api/              # Cấu hình axiosClient (interceptors)
│   ├── components/       # UI Components dùng chung
│   ├── layouts/          # Các bộ khung trang (MainLayout, AuthLayout)
│   └── stores/           # Global Zustand Stores (AppStore)
└── main.tsx              # Entry point
```

## 3. Quy chuẩn Lập trình (Coding Conventions)

### 3.1 Fetch Data và Caching
**Bắt buộc sử dụng TanStack React Query**. 
- API calls đặt trong `api/`.
- Hooks đặt trong `hooks/` (VD: `useInvoices`, `useCreateInvoice`).

### 3.2 State Management
- **Zustand:** Chỉ dùng cho UI State (Sidebar, Theme, Tenant ID).
- **React Query:** Quản lý Server State (Data từ API).

### 3.3 UI và Styling
- **Ant Design:** Cho Components (Table, Form, Input).
- **Tailwind CSS:** Cho Layout và Spacing.

### 3.4 Phân quyền (RBAC)
- Khai báo route trong `registry.ts`.
- Sử dụng `<ProtectedRoute />` và `<HasRole />` để kiểm soát truy cập.

## 4. Checklist triển khai Module mới
1. [ ] Cập nhật Type ở `types/`.
2. [ ] Viết hàm gọi API ở `api/`.
3. [ ] Tạo custom Hooks React Query ở `hooks/`.
4. [ ] Tạo trang List/Form/Detail ở `pages/`.
5. [ ] Đăng ký Route vào `registry.ts`.
