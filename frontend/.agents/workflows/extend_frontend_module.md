---
description: Mở rộng chức năng cho một module Frontend đã tồn tại (Extend an existing module)
---

# 🚀 Mở rộng Module Frontend (Extend Frontend Module)

Sử dụng workflow này khi cần bổ sung tính năng mới, thêm Component, Endpoint API mới hoặc màn hình con cho một feature đã tồn tại trong `src/features/{module}`.

## Bước 1: Bổ sung Endpoint API

- Mở `src/features/{module}/api/{module}Api.ts`.
- Định nghĩa hàm gọi API (axios) trả về cấu trúc Interface Typescript đã quy định.
- *Ví dụ: backend vừa bổ sung chức năng Update Trạng thái.*
```typescript
export const updateStatusExample = async (id: string, newStatus: string) => {
  const result = await axiosClient.put(`/${MODULE_NAME}/${id}/status`, { status: newStatus });
  return result.data;
};
```

## Bước 2: Bổ sung React Query Mutation (hoặc Query)

- Nếu đây là thao tác Create/Update/Delete (POST, PUT, DELETE), hãy mở/tạo file `src/features/{module}/hooks/useUpdateStatus.ts`.
- Sử dụng `useMutation` từ `@tanstack/react-query` và tích hợp Cache Validation để làm mới danh sách đang tồn tại.
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStatusExample } from '../api/{module}Api';
import { notification } from 'antd'; // Tự chọn hệ thống message UI

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateStatusExample(id, status),
    onSuccess: () => {
       // Refresh lại danh sách
       queryClient.invalidateQueries({ queryKey: ['{module_name}'] });
       notification.success({ message: 'Cập nhật thành công!' });
    },
    onError: (error) => {
       notification.error({ message: 'Cập nhật thất bại!' });
    }
  });
};
```

## Bước 3: Bổ sung UI Components

- Thay vì viết một file Component trang khổng lồ (vd: `ExampleDetail.tsx`), hãy chia nhỏ nó ra và cất các block nhỏ mang tính tái sử dụng cục bộ vào `src/features/{module}/components`. 
- Thêm mới UI, Form, Modal (Ví dụ: `UpdateStatusModal.tsx`).
- Liên kết nó qua Component chính và gọi hàm `mutate()` từ Hook tạo ở Bước 2.

## Bước 4: Khai báo Route mới (Nếu có màn hình hoàn toàn mới)

- Khai báo các Route con trong file `src/features/{module}/routes.ts` bằng Node Array của React Router v7.
- Import biến cấu hình từ Feature đó vào trong `src/app/routes/registry.ts` để nó tự động được load.
- Kiểm tra tính gắn kết hiển thị Sidebar.
