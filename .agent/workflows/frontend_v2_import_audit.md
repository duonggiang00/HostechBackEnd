---
description: Bộ quy trình Audit đường dẫn import cho FrontendV2, đảm bảo không có link hỏng, lỗi alias và tuân thủ kiến trúc.
---

# Frontend V2 Import Audit Workflow

**Mục tiêu**: Đảm bảo toàn bộ các đường dẫn import trong `frontendV2Hostech` là chính xác, không gây lỗi runtime/build và tuân thủ các Alias (`@/`) đã cấu hình.

**Checklist Rà soát**:

## 1. Xác thực Đường dẫn (Path Validation)
- [ ] **Alias `@/`**: Đảm bảo tất cả các import từ thư mục `src` đều sử dụng alias `@/` thay vì đường dẫn tương đối dài (vd: `../../../shared` -> `@/shared`).
- [ ] **File Existence**: Kiểm tra xem file được import có thực sự tồn tại không. Đặc biệt lưu ý các file vừa mới move hoặc rename.
- [ ] **Case Sensitivity**: Kiểm tra tính đồng nhất về hoa thường (vd: `MeterListPage.tsx` vs `meterlistpage.tsx`). Windows có thể bỏ qua lỗi này nhưng Linux (Production) sẽ báo lỗi.

## 2. Rà soát Kiến trúc (Architectural Boundaries)
- [ ] **Feature Isolation**: Một feature (vd: `PropertyScope/features/rooms`) KHÔNG nên import trực tiếp các file từ bên trong folder `features` của module khác. Nếu cần dùng chung, hãy chuyển vào `shared/`.
- [ ] **Shared Layer**: Các components/hooks trong `shared/` không được phép import ngược lại các file từ thư mục `features/` cụ thể nào đó (tránh Circular Dependency).

## 3. Kiểm tra Tự động (Automated Scripts)
Chạy các lệnh sau trong terminal tại thư mục `frontendV2Hostech`:

// turbo
```powershell
# 1. Tìm các import chứa đường dẫn tương đối dài và gợi ý đổi sang alias @/
Get-ChildItem -Recurse -Filter *.tsx,*.ts | Select-String -Pattern "import.*from\s+['\"](\.\.\/){2,}"

# 2. Tìm các import có thể bị hỏng (giả định dùng grep để tìm các lỗi phổ biến sau khi refactor)
# Thay [StoreName] bằng tên store vừa refactor
grep -r "useScopeStore" src/
```

## 4. Rà soát TypeScript & Build
- [ ] **Tsc Check**: Chạy `npx tsc --noEmit` để trình biên dịch kiểm tra toàn bộ lỗi module resolution.
- [ ] **Vite Dev Log**: Kiểm tra cửa sổ terminal chạy `npm run dev`, đảm bảo không có cảnh báo `[plugin:vite:import-analysis]`.

## 5. Dọn dẹp (Cleanup)
- [ ] **Unused Imports**: Xóa bỏ các dòng import đã khai báo nhưng không còn sử dụng (thường có màu mờ trong VSCode hoặc báo warning trong ESLint).
- [ ] **Barrel Files**: Kiểm tra các file `index.ts` (nếu có) để đảm bảo export đúng và không bị lặp.

---
**Ghi chú cho Agent**: Khi thực hiện audit này, hãy ưu tiên sử dụng `grep_search` và `find_by_name` để xác minh sự tồn tại của file trước khi kết luận.
