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
  Gauge,
  Users,
  UserRoundCog,
  ShieldAlert,
  Layers,
  DoorOpen,
  TicketCheck,
  ClipboardCheck,
} from "lucide-react";

// ── Categories & Groups ───────────────────────

export const sidebarFlatItems: SidebarItem[] = [
  {
    key: "dashboard",
    label: "Trang quản trị",
    path: "/manage",
    icon: <LayoutDashboard />,
    roles: ["Owner", "Manager", "Staff"],
  },
  {
    key: "statistical",
    label: "Thống kê",
    path: "/manage/statistical",
    icon: <ChartSpline />,
    roles: ["Owner", "Manager", "Staff"],
  },
];

export const infrasItems: SidebarItem[] = [
  { key: "property-list", label: "Quản lý nhà", path: "/manage/properties", icon: <House />, roles: ["Owner", "Manager", "Staff"] },
  { key: "floor-list", label: "Quản lý tầng", path: "/manage/floors", icon: <Layers />, roles: ["Manager", "Staff"] },
  { key: "room-list", label: "Quản lý phòng", path: "/manage/rooms", icon: <DoorOpen />, roles: ["Manager", "Staff", "Tenant"] },
  { key: "meters", label: "Quản lý đồng hồ", path: "/manage/meters", icon: <Gauge />, roles: ["Owner", "Manager", "Staff"] },
  { key: "tickets", label: "Sự cố & Hỗ trợ", path: "/manage/tickets", icon: <TicketCheck />, roles: ["Owner", "Manager", "Staff", "Tenant"] },
  { key: "handovers", label: "Bàn giao phòng", path: "/manage/handovers", icon: <ClipboardCheck />, roles: ["Owner", "Manager", "Staff"] },
];

export const financeItems: SidebarItem[] = [
  {
    key: "services",
    label: "Dịch vụ",
    path: "/manage/services",
    icon: <Zap />,
    roles: ["Owner", "Manager", "Staff"],
  },
  {
    key: "contracts",
    label: "Hợp đồng",
    path: "/manage/contracts",
    icon: <FileText />,
    roles: ["Owner", "Manager", "Staff"],
  },
  {
    key: "invoices",
    label: "Hóa đơn",
    path: "/manage/invoices",
    icon: <Receipt />,
    roles: ["Owner", "Manager", "Staff"],
  },
];

export const userGroups: SidebarGroup[] = [
  {
    key: "users",
    label: "Quản lý người dùng",
    icon: <UserRoundCog />,
    roles: ["Admin", "Owner", "Manager"],
    items: [
      { key: "all-users", label: "Danh sách người dùng", path: "/manage/users", icon: <Users />, roles: ["Admin", "Owner", "Manager"] },
    ],
  },
  {
    key: "system",
    label: "Hệ thống",
    icon: <ShieldAlert />,
    roles: ["Admin"],
    items: [
      { key: "audit-logs", label: "Nhật ký hoạt động", path: "/manage/audit-logs", icon: <FileText />, roles: ["Admin"] },
    ],
  },
];
