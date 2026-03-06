---
description: Rà soát module frontend so với tiêu chuẩn kiến trúc dự án
---

# 🔎 Rà soát Module Frontend (Audit Frontend Module)

Sử dụng workflow này để kiểm tra (audit) một Module/Feature hiện có trong dự án Frontend xem có tuân thủ đúng kiến trúc đã thống nhất hay không (dựa trên `FRONTEND_ARCHITECTURE.md`).

## 1. Kiểm tra Cấu trúc Thư mục (Folder Structure)

Kiểm tra thư mục `src/features/{module}` có tồn tại không. Đảm bảo toàn bộ nghiệp vụ (UI, Call API, Hooks) cấu thành khối logic của `module` đều nằm bên trong:

- [ ] Lệnh gọi mạng phải nằm ở `api/` (VD: `api/{module}Api.ts`).
- [ ] Type definitions nằm ở `types/` thay vì vứt chung vào global `Types/` (Trừ type hệ thống).
- [ ] Hook gọi dữ liệu phải ở `hooks/` dựa trên `React Query` thay vì useEffect().

## 2. Kiểm tra React Query (Fetch Data Caching)

- [ ] Bắt buộc gọi `useQuery` và `useMutation` lấy từ thẻ `hooks/`.
- [ ] Không có component nào gọi trực tiếp API bằng `axios` bên trong hook `useEffect()`. React Query đảm bảo caching và retry state.

## 3. Kiểm tra State Management (Zustand)

- [ ] Zustand Store (nếu được sử dụng trong thư mục `stores/`) dùng lưu UI state (như modal đang bật hay tắt, step trong form, local storage filters...) hoặc global state (Sidebar, TenantID).
- [ ] UI không nạp danh sách thực thể backend vào Zustand store như một biến mảng (Ví dụ: Không có Store `exampleList: Example[]` — đó là công việc của React Query Cache).
- [ ] Đảm bảo các thành phần dùng chung trên 2 module trở lên phải đặt ở `src/shared/components` thay vì để cục bộ trong tính năng.

## 4. Kiểm tra Form (React Hook Form)

- [ ] Component Form sử dụng `useForm()` hook của `react-hook-form`.
- [ ] Input của **Ant Design** (vd: `Input`, `Select`, `DatePicker`) phải được wrap bằng thẻ `<Controller>` của `react-hook-form`.
- [ ] Validate bằng `hookform/resolvers` và `zod` nếu có, thay vì validate thủ công rải rác từng input.
- [ ] Performance: Các keystroke trên input dài không gây re-render lên Component Cha.

## 5. Kiểm tra UI, Styling (Tailwind + Antd)

- [ ] Lưới Layout, padding, flex phải sử dụng ClassName của **Tailwind** (`className="flex flex-col gap-4 p-4"`).
- [ ] Thành phần cấu thành như Bảng (Table), Inputs, Nút bấm (Button) ưu tiên dùng **Ant Design Component**, tránh tự code thẻ `<table>` `<tr>` từ đầu.
- [ ] Nếu phải viết CSS, chỉ sử dụng Tailwind utility classes thay vì thêm file `.css` không cần thiết (ngoài việc định nghĩa các biến ở root `index.css`).

## 6. Kiểm tra Bảo mật và RBAC

- [ ] Giao diện có hành vi ẩn/hiện nút (Button Tác vụ như "Xóa", "Sửa") tuân thủ theo rule Permission hệ thống.
- [ ] Các logic che chắn nội dung này đi qua một hook như `useRole()` hoặc `useRequirePermission()`. 
- [ ] Đường dẫn (Route) dành cho UI của tính năng này (ví dụ `/properties/:id`) ở tầng `react-router` phải có thẻ Component Guard kiểm tra mức truy cập.

> Nếu bất kỳ điều kiện nào (đặc biệt mục 2 và 4) bị vi phạm, Module này cần phải **Reactoring (Viết lại)** theo đúng kiến trúc.
