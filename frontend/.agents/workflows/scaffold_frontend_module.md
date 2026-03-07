---
description: Tự động hóa việc tạo cấu trúc thư mục và file khởi điểm cho một module Frontend mới (Feature-based)
---

# 🚀 Quy trình Khởi tạo Module Frontend (Scaffold Frontend Module)

Sử dụng workflow này khi bạn cần bắt đầu một tính năng (feature) mới bên mảng Frontend, bám sát kiến trúc Feature-based của Hostech.

> **Trường hợp sử dụng:** Có một bảng mới ở Database Backend (Ví dụ: `Vouchers`), đã viết xong API, giờ cần làm UI.

---

## Bước 1: Khởi tạo cấu trúc thư mục

// turbo-all
Tạo hệ thống thư mục cục bộ cho tính năng mới. Giả sử biến môi trường là tên module (viết thường, số nhiều).
```bash
MODULE_NAME="example"

mkdir -p frontend/src/features/${MODULE_NAME}/api
mkdir -p frontend/src/features/${MODULE_NAME}/components
mkdir -p frontend/src/features/${MODULE_NAME}/hooks
mkdir -p frontend/src/features/${MODULE_NAME}/pages
mkdir -p frontend/src/features/${MODULE_NAME}/stores
mkdir -p frontend/src/features/${MODULE_NAME}/types
```

---

## Bước 2: Khởi tạo định nghĩa Type (Typescript Types)

Tạo file `types/index.ts` chứa định nghĩa kiểu dữ liệu mô phỏng lại Resource trả về từ Backend.

_Ví dụ mẫu:_
```typescript
// frontend/src/features/{module_name}/types/index.ts
export interface ExampleType {
  id: string; // UUID from backend
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}
```

---

## Bước 3: Cài đặt tầng API Client (Axios)

Tạo file `api/${MODULE_NAME}Api.ts` đóng gói riêng biệt các lệnh gọi mạng (Axios).

_Ví dụ mẫu:_
```typescript
// frontend/src/features/{module_name}/api/{module_name}Api.ts
import axiosClient from "@/shared/api/axiosClient";
import { ExampleType } from '../types';

export const getExamples = async (): Promise<ExampleType[]> => {
  const response = await axiosClient.get(`/${MODULE_NAME}`);
  return response.data?.data ?? response.data;
};

// Chú ý: Luôn trả về Promise định danh Type rõ ràng.
```

---

## Bước 4: Tạo React Query Custom Hooks

Tạo file `hooks/use${MODULE_NAME}.ts` sử dụng `TanStack React Query` để fetch và quản lý trạng thái tải (loading state, error state).

_Ví dụ mẫu:_
```typescript
// frontend/src/features/{module_name}/hooks/useExamples.ts
import { useQuery } from '@tanstack/react-query';
import { getExamples } from '../api/{module_name}Api';

export const useExamples = () => {
  return useQuery({
    queryKey: ['{module_name}'],
    queryFn: getExamples,
  });
};
```

---

## Bước 5: Khởi tạo UI cơ bản

Tạo file `pages/${MODULE_NAME}ListPage.tsx` thiết kế giao diện danh sách của bạn (kết hợp thư viện UI Ant Design). Sử dụng hook React Query ở Bước 4.

_Ví dụ mẫu:_
```tsx
// frontend/src/features/{module_name}/pages/{module_name}ListPage.tsx
import React from 'react';
import { Table } from 'antd';
import { useExamples } from '../hooks/useExamples';

export const ExampleListPage = () => {
  const { data, isLoading } = useExamples();
  // ... Cấu hình column antd ...
  return <Table loading={isLoading} dataSource={data} rowKey="id" />;
};
```

---

## Bước 6: Cập nhật Router

Tạo file định tuyến `src/features/${MODULE_NAME}/routes.ts` để cấu hình đường dẫn và Component cho tính năng.
Sau đó, mở file `src/app/routes/registry.ts` và import/đăng ký `routes` mới vào `manageRoutes` hoặc `portalRoutes` tùy đối tượng sử dụng.

## Bước 7: Kiểm soát quyền (RBAC Check)

Bọc các nút bấm hoặc hành động nhạy cảm bằng hook kiểm tra quyền để đảm bảo UI nhất quán với Backend Policy.

_Ví dụ mẫu:_
```tsx
const { can } = usePermission();
// ...
{can('create', 'examples') && <Button>Thêm mới</Button>}
```

**Xong! Bạn đã có cốt lõi của một Module Frontend đúng chuẩn Hostech.**
