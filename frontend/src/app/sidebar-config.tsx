/**
 * SIDEBAR CONFIG — Aggregate điểm duy nhất
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  HƯỚNG DẪN THÊM ITEM VÀO SIDEBAR:                           ║
 * ║  1. Thêm SidebarItem hoặc SidebarGroup vào mảng bên dưới    ║
 * ║  2. KHÔNG cần sửa Sidebar.tsx                                ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * BASE PATH: /manage (Phase D1 migration từ /admin)
 */
import type { SidebarItem, SidebarGroup } from "../shared/types/navigation";

import {
  LayoutDashboard,
  ChartSpline,
  Zap,
  FileText,
  Receipt,
  House,
  MapPinCheck,
  StretchHorizontal,
  Warehouse,
  Gauge,
  Users,
  UserRoundCog,
  Shield,
} from "lucide-react";

// ── Categories & Groups ───────────────────────

export const sidebarFlatItems: SidebarItem[] = [
  {
    key: "dashboard",
    label: "Trang quản trị",
    path: "/manage",
    icon: <LayoutDashboard />,
  },
  {
    key: "statistical",
    label: "Thống kê",
    path: "/manage/statistical",
    icon: <ChartSpline />,
  },
];

export const infrasItems: SidebarItem[] = [
  { key: "property-list", label: "Quản lý nhà", path: "/manage/properties", icon: <House /> },
  { key: "orgs", label: "Quản lý tổ chức", path: "/manage/orgs", icon: <MapPinCheck /> },
  { key: "floors", label: "Quản lý tầng", path: "/manage/floors", icon: <StretchHorizontal /> },
  { key: "rooms", label: "Quản lý phòng", path: "/manage/rooms", icon: <Warehouse /> },
  { key: "meters", label: "Quản lý đồng hồ", path: "/manage/meters", icon: <Gauge /> },
];

export const financeItems: SidebarItem[] = [
  {
    key: "services",
    label: "Dịch vụ",
    path: "/manage/services",
    icon: <Zap />,
  },
  {
    key: "contracts",
    label: "Hợp đồng",
    path: "/manage/contracts",
    icon: <FileText />,
  },
  {
    key: "invoices",
    label: "Hóa đơn",
    path: "/manage/invoices",
    icon: <Receipt />,
  },
];

export const userGroups: SidebarGroup[] = [
  {
    key: "users",
    label: "Quản lý người dùng",
    icon: <UserRoundCog />,
    items: [
      { key: "tenant", label: "Người thuê", path: "/manage/tenant", icon: <Users /> },
      { key: "manager", label: "Quản lý", path: "/manage/manager", icon: <UserRoundCog /> },
      { key: "staff", label: "Nhân viên", path: "/manage/staff", icon: <Shield /> },
    ],
  },
];
