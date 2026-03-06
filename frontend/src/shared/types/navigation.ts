import type { ComponentType, ReactNode } from "react";

/**
 * Định nghĩa 1 route của 1 feature.
 * Mỗi feature khai báo routes của nó trong features/xxx/routes.tsx
 * Không cần động vào App.tsx.
 */
export interface RouteConfig {
  path: string;
  Component: ComponentType;
  children?: RouteConfig[];
}

/**
 * Định nghĩa 1 item trong Sidebar menu.
 * Mỗi feature khai báo sidebar config của nó.
 * Không cần động vào Sidebar.tsx.
 */
export interface SidebarItem {
  key: string;           // unique key, vd: "contracts"
  label: string;         // label hiển thị
  path?: string;         // đường dẫn (nếu là link)
  icon: ReactNode;       // lucide-react icon
  roles?: string[];      // roles được phép thấy (undefined = mọi role)
  children?: SidebarItem[];
}

/**
 * Nhóm sidebar (vd: "Quản lý khu nhà", "Quản lý người dùng")
 */
export interface SidebarGroup {
  key: string;
  label: string;
  icon: ReactNode;
  roles?: string[];
  items: SidebarItem[];
}

/**
 * Entry điểm đăng ký của một feature module
 */
export interface FeatureModule {
  routes: RouteConfig[];
  sidebarItems?: SidebarItem[];   // flat items (dùng cho có link thẳng)
  sidebarGroup?: SidebarGroup;    // grouped items (dùng cho dropdown)
}
