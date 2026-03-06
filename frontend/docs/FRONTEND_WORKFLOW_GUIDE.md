# Hướng dẫn Luồng Hoạt động (Workflow Guide) Frontend Hostech

Tài liệu này mô tả chi tiết luồng xử lý dữ liệu và cách các thành phần Frontend tương tác với nhau, đảm bảo tính nhất quán (Consistency) trong toàn bộ dự án.

---

## 1. Kiến trúc Data Flow (Luồng Dữ liệu)

Frontend Hostech sử dụng kiến trúc **Server State quản lý qua React Query**, kết hợp **Client State quản lý qua Zustand**.

### Sơ đồ Luồng gọi API chuẩn (Data Fetching Flow)

1. **Người dùng** truy cập vào một trang (ví dụ: `/manage/properties`).

2. **UI Component** (`PropertiesListPage.tsx`) render giao diện.
3. Component này gọi **Custom Hook** (`useProperties()`).
4. Custom Hook gọi **React Query** (`useQuery`).
5. `useQuery` gọi **Axios API Client** (`getProperties()`).
6. **Axios** gửi HTTP GET Request kèm `Bearer Token` tới `/api/properties`.
7. **Backend** trả về dữ liệu JSON.
8. **React Query** hứng dữ liệu, lưu vào bộ nhớ đệm (Cache), và trả lại cho Component để hiển thị ra màn hình (Table, Chart...).

### Phân biệt State

- **Server State (Dữ liệu từ Database/API):** Ví dụ: Danh sách hóa đơn, Thông tin người dùng, Danh sách phòng. **Bắt buộc** dùng `TanStack React Query`. Không dùng `useEffect` + `useState`. Không nhét vào `Zustand`.
- **Client State (Trạng thái UI cục bộ/Toàn cục):** Ví dụ: Sidebar mở hay đóng, Theme Dark/Light, Form đang ở bước (step) nào, ID của Tenant đang được chọn tạm thời. **Nên** dùng `Zustand` (Global) hoặc `useState`/`useReducer` (Local component).

---

- **Luồng Định tuyến Phân cấp (Semantic Routing):**
  Dự án phân tách rõ rệt không gian quản lý và không gian người dùng cuối.
  - **Management Space (`/manage`):** Dành cho Owner, Manager, Staff. Giao diện dạng Dashboard, bảng biểu mật độ cao. *(Phase D1 — Current)*
  - **Portal Space (`/me`):** Dành cho Tenant. Giao diện Mobile-first, tập trung vào Tiện ích, Hóa đơn, Ticket. *(Đang phát triển Phase 3-4)*
  - **[Roadmap - Phase D2]** Khi Tenant portal đủ features, nâng lên Multi-Space Architecture (xem `FRONTEND_ARCHITECTURE.md`).

- **Flow thêm Route mới:**
  1. Xây dựng feature ở `src/features/{module}`.
  2. Tạo file `src/features/{module}/routes.ts`.
  3. Mở `src/app/routes/registry.ts` và import/đăng ký vào mảng tương ứng (`manageRoutes` hoặc `portalRoutes`).
  => Route sẽ tự động gắn kết vào Layout phù hợp.

### Nested Routing & Outlet
Khi một Layout có thẻ `<Outlet />`, các route con (children routes) sẽ được render vào vị trí đó. Ví dụ `LayoutAdmin` sẽ chứa Sidebar/Header, thẻ `<Outlet />` ở giữa sẽ render nội dung các feature pages.

---

## 3. Luồng Quản lý Form (Form Submission Flow)

Tất cả các form tương tác với API (Create/Update) phải dùng **React Hook Form**.

1. Component Form khởi tạo bằng `const { control, handleSubmit } = useForm<SchemaBoundary>();`.
2. Giao diện (ví dụ Input của Ant Design) được bọc bởi thẻ `<Controller name="fieldName" control={control} />`.
3. Khi người dùng submit, hàm xử lý gọi hook **React Query Mutation** (`useCreateContract()`).
4. Mutation hook thực hiện API POST.
5. Khi API trả về **Thành công (onSuccess)**:
   - Mutation hook gọi `queryClient.invalidateQueries({ queryKey: ['contracts'] })` để làm mới danh sách đang có tĩnh.
   - Bật thông báo Toast/Notification cho người dùng.
   - Redirect hoặc đóng Modal (kích hoạt bằng Zustand hoặc prop `onClose`).

---

## 4. Luồng Xác thực và Bảo mật (Authentication Flow)

Bảo mật được thiết lập từ tầng thấp nhất (Axios) lên tầng cao nhất (Router).

1. **Đăng nhập:** 
   - Gọi `POST /api/login` (Fortify/Sanctum).
   - Backend trả về Token.
   - Component gọi hook của `AuthStore` (Zustand) để lưu lại thẻ Token này vào `localStorage` (hoặc Cookie tùy config Backend).
2. **Mỗi Request kế tiếp:**
   - Axios Interceptor (tại `src/shared/api/axiosClient.ts`) tự động móc token từ Cửa hàng trạng thái (hoặc localStorage) để gắn vào Header: `Authorization: Bearer <token>`.
3. **Mất phiên/Hết hạn Token (401 Unauthorized):**
   - Interceptor "bắt giò" lỗi 401. Nó sẽ xóa Token và redirect user cưỡng bức về phía `/auth` (Login).
4. **Phân quyền Route (Route Guard):**
   - Sử dụng `<ProtectedRoute>` bọc ngoài các cụm route chính để yêu cầu đăng nhập.
   - Sử dụng `<RequireRole>` hoặc hook `useAbility()` để kiểm soát quyền truy cập chi tiết (RBAC).
   - **Tuyệt đối không** hardcode quyền trực tiếp vào component UI lớn; hãy sử dụng registry để quản lý tập trung.

5. **Chính sách Không Mock Data (Zero-Mock Policy):**
   - Tất cả component hiển thị dữ liệu phải fetch thực tế từ API thông qua React Query.
   - Nếu Backend chưa có API, hãy sử dụng **MSW (Mock Service Worker)** ở tầng mạng thay vì nhét mảng cứng vào trong code UI.

---

## 5. Quy chuẩn Viết Code Component UI

- **"Vỏ" dùng Tailwind:** Khoảng cách, Kích cỡ, Layout (Flex/Grid) hoàn toàn bằng ClassName Tailwind v4. Ví dụ: `className="flex flex-col gap-4 p-4 lg:w-1/2"`.
- **"Lõi" dùng Ant Design:** Thể hiện Table dữ liệu, Dropdown, Menu, Form Elements (Select/Input/DatePicker). Đặc biệt sử dụng tính năng `loading` property của Antd kết hợp với biến `isLoading` của React Query cực kỳ thuận lợi (VD: `<Table loading={isLoading} />`).
- **Giao diện Responsive:** Ưu tiên Mobile-first cho các trang mà KHÁCH THUÊ (Tenant) xem, và Desktop-first cho các trang mà BAN QUẢN LÝ (Admin/Owner) xem.
