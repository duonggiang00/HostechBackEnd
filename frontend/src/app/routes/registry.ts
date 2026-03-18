/**
 * ROUTE REGISTRY — Aggregate điểm duy nhất
 *
 * Đây là nơi duy nhất cần thêm feature mới vào danh sách.
 * Chỉ cần thêm 1 dòng import + spread — không cần copy-paste route objects.
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  HƯỚNG DẪN THÊM FEATURE MỚI:                                ║
 * ║  1. Tạo features/xxx/routes.ts (khai báo routes riêng)      ║
 * ║  2. Import và thêm vào adminRoutes bên dưới                  ║
 * ║  3. KHÔNG cần sửa App.tsx                                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
import type { RouteConfig } from "../../shared/types/navigation";

// ── Feature routes ──────────────────────────────────────────────
import { contractRoutes } from "../../features/contracts/routes";
import { invoiceRoutes } from "../../features/invoices/routes";
import { serviceRoutes } from "../../features/services/routes";
import { propertyRoutes } from "../../features/properties/routes";
import { userRoutes } from "../../features/users/routes.tsx";
import { meterRoutes } from "../../features/meters/routes";
import { ticketRoutes } from "../../features/tickets/routes.tsx";
import { handoverRoutes } from "../../features/handover/routes.tsx";
import { dashboardRoutes } from "../../features/dashboard/routes.tsx";
// ── Thêm feature mới → import ở đây ────────────────────────────
import { profileRoutes } from "../../features/profile/routes";
import { dashboardRoutes } from "@/Pages/Admin/Dashboards/router";

/**
 * Tất cả routes bên trong /manage layout.
 * App.tsx spread mảng này vào children của manage route.

 */
/**
 * Các route dành cho Quản lý (Owner/Manager/Staff)
 */
export const manageRoutes: RouteConfig[] = [
  dashboardRoutes,
  contractRoutes,
  invoiceRoutes,
  serviceRoutes,
  ...propertyRoutes,
  ...userRoutes,
  profileRoutes,
  ...orgRoutes,
  systemRoutes,
  ...meterRoutes,
  ...ticketRoutes,
  ...handoverRoutes,
  ...dashboardRoutes,
];

/**
 * Các route dành cho Khách thuê (Tenant Portal)
 */
export const portalRoutes: RouteConfig[] = [
  // Sẽ thêm các feature của tenant vào đây
];

// Giữ lại adminRoutes để tương thích ngược (Backward Compatibility)
export const adminRoutes = manageRoutes;
