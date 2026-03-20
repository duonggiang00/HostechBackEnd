---
description: Bộ quy trình Audit UI/UX chuyên sâu cho FrontendV2, đảm bảo chuẩn thẩm mỹ cao, tính đồng nhất và trải nghiệm người dùng mượt mà theo phong cách hiện đại.
---

# Frontend V2 UI/UX Audit Workflow

**Mục tiêu**: Đảm bảo mọi giao diện (UI) và trải nghiệm (UX) trong `frontendV2` đạt chuẩn "Wow Effect", đồng nhất với hệ thống Design System và mang lại cảm giác cao cấp (Premium). Quy trình này tập trung vào tính thẩm mỹ, hiệu ứng chuyển động và sự tinh tế trong tương tác.

**Các bước Thẩm định (UI Scan Checklist)**:

## 1. Đồng nhất Visual & Design System
- [ ] **Shadcn/UI Compliance**: Sử dụng đúng các component từ `@/shared/components/ui/`. Tuyệt đối không viết inline CSS hoặc dùng ad-hoc utility nếu component đã tồn tại.
- [ ] **Color Palette**: Tuân thủ bảng màu chuẩn (Slate/Indigo/Emerald). Kiểm tra tính cân bằng màu sắc (60-30-10) và độ tương phản.
- [ ] **Dark/Light Mode**: Kiểm tra giao diện ở cả hai chế độ (nếu có). Đảm bảo không có hiện tượng "mất chữ" hoặc màu nền bị chọi.
- [ ] **Iconography**: Sử dụng đồng nhất thư viện `lucide-react`. Các icon phải có kích thước tiêu chuẩn (thường là `w-4 h-4` hoặc `w-5 h-5`) và độ dày (`strokeWidth={2}`) đồng nhất.

## 2. Typography & Hierarchy (Phân cấp thông tin)
- [ ] **Font Scale**: Sử dụng đúng class `text-xs` đến `text-2xl`. Heading (`h1`, `h2`, `h3`) phải rõ ràng, phân biệt được nội dung chính và phụ.
- [ ] **Font Weight**: Tận dụng `font-bold` cho tiêu đề và `font-medium`/`font-normal` cho nội dung. Tránh dùng quá nhiều `font-black`.
- [ ] **Micro-copy**: Câu chữ phải chuyên nghiệp, súc tích (Ngôn ngữ: Tiếng Việt chuẩn). Kiểm tra lỗi chính tả và tính nhất quán (ví dụ: "Xoá" vs "Bỏ").

## 3. Tương tác & Phản hồi (Feedback Loop)
- [ ] **Interactive States**: Mọi button, link, menu item BẮT BUỘC phải có hiệu ứng `hover`, `active` và `focus`. Ưu tiên hiệu ứng `active:scale-95` cho cảm giác vật lý.
- [ ] **Loading Feedback**:
    - [ ] Sử dụng `Skeleton` cho loading danh sách/card.
    - [ ] Hiển thị spinner (`Loader2` từ Lucide) hoặc thay đổi text/opacity trên button khi đang xử lý (Pending state).
- [ ] **Toasts & Alerts**: Thông báo thành công/thất bại phải xuất hiện kịp thời qua `react-hot-toast`. Thông báo phải có icon phù hợp.

## 4. Chuyển động & Hiệu ứng (Animations)
- [ ] **Framer Motion**: Các modal, drawer, hoặc chuyển đổi step (Wizard) phải có hiệu ứng `initial`, `animate`, `exit`.
- [ ] **Smooth Transitions**: Sử dụng `AnimatePresence` để tránh việc UI biến mất đột ngột. Hiệu ứng phải nhẹ nhàng (thường là `duration: 0.2` hoặc `0.3`), không gây mỏi mắt.
- [ ] **Empty States**: Trang trống phải có minh họa (Icon/Illustrations) và câu kêu gọi hành động (CTA) rõ ràng.

<h2>5. Bố cục & Responsive (Layout)</h2>
- [ ] **Grid/Flex Consistency**: Sử dụng `gap` đồng nhất (thường là `gap-4`, `gap-6`).
- [ ] **Mobile-First Check**: Kiểm tra giao diện trên màn hình nhỏ. Ẩn bớt các cột không quan trọng trong table hoặc chuyển sang dạng Card view trên mobile.
- [ ] **Spacing**: Đảm bảo "khoảng thở" (White space) hợp lý. Tránh việc các component dính sát vào mép màn hình (sử dụng `p-4` hoặc `p-6` cho container chính).

## 6. Audit Công cụ (Verification Tools)
- [ ] **Browser Inspect**: Kiểm tra `z-index` để đảm bảo dropdown không bị che khuất hoặc modal không đè lên toast.
- [ ] **Console Watch**: Không được để lại Error/Warning về UI trong console (ví dụ: `key` prop missing trong list).
- [ ] **Performance UI**: UI không bị giật lag khi re-render lớn (kiểm tra React DevTools Profiler nếu cần).
