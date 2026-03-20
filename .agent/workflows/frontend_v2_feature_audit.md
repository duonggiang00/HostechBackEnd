---
description: Bộ quy trình Audit (Kiểm thử & Rà soát) cho một chức năng FrontendV2 hoàn chỉnh, đảm bảo chuẩn kiến trúc, hiệu năng và UX như model Rooms.
---

# Frontend V2 Feature Audit Workflow

**Mục tiêu**: Rà soát và đánh giá tự động/thủ công một module/feature FrontendV2 để đảm bảo tuân thủ tuyệt đối các tiêu chuẩn kỹ thuật (được rút ra từ kiến trúc chuẩn của `rooms` feature). Workflow này dùng cho Agent hoặc Code Reviewer trước khi merge code.

**Các bước Rà soát (Audit Checklist)**:

## 1. Rà soát Types & Interfaces (`types.ts`)
- [ ] **Type Safety**: Tất cả DTOs (Data Transfer Objects cho Create/Update) và Models nội bộ đã được định nghĩa rõ ràng. Tuyệt đối không sử dụng type `any` cho các Payload gửi đi.
- [ ] **Query Params**: Interface `[Feature]QueryParams` phải kế thừa hoặc khai báo đầy đủ các field phân trang (`page`, `per_page`), sắp xếp (`sort`), tìm kiếm (`search`), và bộ lọc (`filter[...]`).

## 2. Rà soát Tầng API (`api/[feature_name].ts`)
- [ ] **AbortSignal Integration**: Các hàm lấy danh sách (vd: `getList`, `getTrash`) BẮT BUỘC phải nhận tham số `signal?: AbortSignal` và truyền vào cấu hình của Axios (`apiClient.get(url, { signal })`).
- [ ] **Response Extraction**: Hàm trả về đúng dữ liệu (vd: `response.data.data` thay vì bọc thừa).
- [ ] **Telemtry/Logs**: Có các dòng `console.log('📡 API: ...')` rõ ràng trước khi return data để dễ dàng debug data flow trên trình duyệt.

## 3. Rà soát React Query Hooks (`hooks/use[Feature].ts`)
- [ ] **Constants**: Query Keys được khai báo dưới dạng hằng số ở đầu file (vd: `const FEATURE_KEY = 'features';`).
- [ ] **Query Optimization (List)**:
    - [ ] Có sử dụng `placeholderData: keepPreviousData` để ngăn hiện tượng "nháy trắng" màn hình khi chuyển trang hoặc đổi bộ lọc.
    - [ ] Thuộc tính `enabled` được thiết lập chặt chẽ (vd: chỉ fetch khi có đủ `propertyId`).
- [ ] **Mutation Lifecycle**: Hook gộp các hành động (vd: `use[Feature]Actions`) PHẢI gọi chính xác `queryClient.invalidateQueries({ queryKey: [...] })` trong `onSuccess` cho mọi actions (Create, Update, Delete, Force Delete, Restore).

## 4. Rà soát Tích hợp UI Component & Page (`pages/` & `components/`)
- [ ] **URL Sync**: Trạng thái của file tĩnh (Search keyword, Page number, Sort rules, Filters) TRÊN LIST PAGE phải được đồng bộ hóa với thanh địa chỉ URL (URL Synchronization).
- [ ] **Mutually Exclusive Fetching (Tránh N+1 Request)**:
    - [ ] Việc Toggle giữa "Danh sách đang hoạt động" và "Thùng rác" phải thay đổi cờ `enabled` của các hooks tương ứng. KHÔNG ĐƯỢC phép gọi đồng thời cả 2 lists nếu user chỉ đang xem 1 list.
- [ ] **Responsiveness & State Handling**:
    - [ ] Loading State và Error State được handle hiển thị skeleton/spinner hợp lý.
    - [ ] Cung cấp Empty State rõ ràng khác biệt (vd: "Không có dữ liệu" vs "Thùng rác trống").
- [ ] **Dumb Components**: Các Component con UI (Cards, Tables, Modals) không trực tiếp gọi API mà phải nhận Data và Event Callbacks thông qua props từ Smart Page.

## 5. Rà soát Kỹ thuật Tổng thể (Technical Checks)
- [ ] Chạy lệnh `npx tsc --noEmit` để đảm bảo code module này hoàn toàn không vướng lỗi TypeScript.
- [ ] Bật Network Tab (DevTools), thực hiện gõ search liên tục. Xác nhận các request cũ bị đánh dấu `(canceled)` bởi `AbortSignal`.
- [ ] Thử thực hiện 1 thao tác Mutation (ví dụ: Xóa data), đảm bảo UI List tự động refetch mà không cần F5.
