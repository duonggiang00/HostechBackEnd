---
description: Rà soát module frontend so với tiêu chuẩn kiến trúc dự án
---

# Audit Frontend Module Workflow

**Mục tiêu**: Đảm bảo code đạt chuẩn 100% về kiến trúc Multi-Space và bảo mật trước khi tiếp tục module khác. BẮT BUỘC chạy ở cuối mỗi module.

**Các bước thực hiện**:
1. **TypeScript Audit**: Chạy `npx tsc --noEmit` để đảm bảo hệ thống frontend không có lỗi Type. Cấm sử dụng `any` cho Payload API.
2. **React Hooks Audit**: Rà soát các Dependency Array để tránh vòng lặp infinite re-render. Kiểm tra các Query Keys đảm bảo Optimistic Cache Update đúng logic.
3. **Role-Based Access Control Audit**:
   - Sử dụng agent test và `browser_subagent` để test tay việc đăng nhập và khóa UI đối với 4 nhóm tài khoản chuẩn: Owner, Manager, Staff, và Tenant.
4. **Sidebar Navigation Audit**: 
   - Kiểm tra `frontend/src/app/sidebar-config.tsx`.
   - Đảm bảo Sidebar Route phải hoàn toàn phản chiếu chính xác State và Feature hiện tại, hợp nhất logic và tuyệt đối không để 404 error page.
