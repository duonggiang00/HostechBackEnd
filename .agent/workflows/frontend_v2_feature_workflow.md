---
description: Bộ quy trình (Workflow) chi tiết cho FrontendV2 khi triển khai một Feature hoàn chỉnh dựa trên hình mẫu Rooms Feature.
---

# Frontend V2 Feature Implementation Workflow

**Mục tiêu**: Xây dựng một chức năng (Feature) Frontend hoàn chỉnh trong kiến trúc `frontendV2` của dự án. Workflow này được đúc kết từ hình mẫu chuẩn mực của `PropertyScope/features/rooms`, đảm bảo UI mượt mà, State Management tối ưu, và tương tác API chính xác.

**Nguyên tắc cốt lõi**:
1. Tuân thủ kiến trúc thư mục Feature-based.
2. Tối ưu performance bằng URL Synchronization & React Query `keepPreviousData`.
3. Kiểm soát Request bằng `AbortSignal` để tránh Race Conditions.
4. Quản lý trạng thái (State) tập trung thông qua `use[Feature]Actions`.

---

## Bước 1: Khởi tạo Cấu trúc Thư mục
Tạo thư mục feature tại `src/[Scope]/features/[feature_name]` với cấu trúc:
```
[feature_name]/
├── api/
│   └── [feature_name].ts   # Tương tác Axios gọi API
├── components/             # Các UI Components "Ngu" (Dumb Components)
├── hooks/
│   └── use[Feature].ts     # Custom React Query Hooks cho trạng thái & Mutation
├── pages/                  # "Smart" Components (Containers) 
│   ├── [Feature]ListPage.tsx
│   └── [Feature]DetailPage.tsx
└── types.ts                # Khai báo Interface & Type nội bộ
```

## Bước 2: Định nghĩa Types (`types.ts`)
Map chính xác Database/Backend Resource bằng TypeScript interfaces:
1. **Model Interfaces**: Định nghĩa type cho Resource chính (ví dụ: `Room`, `Floor`).
2. **Status/Enums**: Tạo Type union cho trạng thái (ví dụ: `type RoomStatus = 'draft' | 'available'`).
3. **Query Params**: Định nghĩa interface cho bộ lọc API (cần hỗ trợ Pagination và `search`, `sort`).
4. **Payloads**: Định nghĩa các DTO dùng cho Create, Update.

## Bước 3: Tích hợp API Client (`api/[feature_name].ts`)
Trừu tượng hóa hoàn toàn HTTP requests bằng `apiClient`:
1. Viết một object `featureApi` (vd: `roomsApi`) chứa tất cả phương thức CRUD.
2. **List Requests**: Định nghĩa params nhận vào (xử lý `filter[...]`). CỰC KỲ QUAN TRỌNG: Phải hỗ trợ `signal?: AbortSignal` cho việc hủy request.
3. Log kết quả rõ ràng bằng `console.log('📡 API: GET /endpoints', response.data)` để dễ debug.
4. Trả về đúng format array từ response (vd: `response.data.data`).

## Bước 4: Xây dựng React Query Hooks (`hooks/use[Feature].ts`)
Đóng gói mọi Logic gọi API vào các hook:
1. **Query Keys**: Cố định hằng số query key (vd: `const ROOMS_KEY = 'rooms';`).
2. **List Query Hook (`use[Feature]List`)**:
   - Truyền `params` vào `queryKey`.
   - Kết hợp `AbortSignal` vào hàm API: `queryFn: async ({ signal }) => api.getList(params, signal)`.
   - **Tối ưu UX**: Áp dụng `placeholderData: keepPreviousData` (không flash màn hình).
   - **Tối ưu Fetch**: Dùng tùy chọn `{ enabled: boolean }` để chặn gọi API khi params chưa sẵn sàng.
3. **Action Hook (`use[Feature]Actions`)**:
   - Sử dụng `useQueryClient()` để kiểm soát cache.
   - Gom tất cả Mutation (Create, Update, Delete, Batch) vào chung một hook.
   - Sau khi Mutation thành công (`onSuccess`), bắt buộc gọi `queryClient.invalidateQueries` với đúng `KEY` để tự động làm mới UI.

## Bước 5: Phân chia Smart Page & Dumb Components
### 5.1 Dumb Components (`components/`)
- Chia nhỏ UI thành các phần tử nhận `props` (vd: `FilterBar`, `DataTable`, `ItemCard`).
- Đẩy toàn bộ logic gọi API và điều hướng (routing) ra ngoài, chỉ phát ra Events (`onEdit`, `onDelete`).

### 5.2 Smart Page (`pages/[Feature]ListPage.tsx`)
1. **URL State Synchronization**: 
   - Quản lý `search`, `page`, `sort`, và `filters` thông qua Hook đồng bộ URL (hoặc trực tiếp xử lý `searchParams`). Đảm bảo link luôn có thể chia sẻ (Shareable URLs).
2. **State & Fetching**:
   - Gọi list query hook: `const { data, isFetching } = useList(filters)`.
3. **Actions**:
   - Lấy action từ `const { deleteItem, batchDelete } = use[Feature]Actions()`.
4. **Conditional Views**:
   - Thiết kế các Empty State rõ ràng khi không có dữ liệu.
   - Thêm cờ `enabled: !isTrashView` nếu có chức năng Toggle View giữa "Hiện tại" & "Thùng rác", để chặn API gọi trùng lặp (tránh N+1 Request từ Frontend).

## Bước 6: Kiểm tra & Nghiệm thu (Review Checklist)
Một feature đạt chuẩn kiến trúc frontendV2 khi thỏa mãn:
- [ ] Không có "white flash" khi paginate / chuyển filter (nhờ `keepPreviousData`).
- [ ] Hủy được Request dư thừa nếu gõ search nhanh (nhờ `AbortSignal`).
- [ ] Mọi state của List Page đều tái tạo được chỉ bằng việc refresh F5 đường rèn (URL Sync).
- [ ] Action như Update/Delete làm UI cập nhật ngay lập tức (phản hồi Invalidations đúng `queryKey`).
- [ ] Có Typescript rõ ràng bảo vệ mọi Payload truyền đi và Data trả về.
