import type { RouteConfig } from "../../shared/types/navigation";
import Tenant from "./pages/Tenants/Tenant";
import DetailTenant from "./pages/Tenants/detail";
import Manager from "./pages/Manager/Manager";
import DetailManager from "./pages/Manager/detail";
import Staff from "./pages/Staff/Staff";
import DetailStaff from "./pages/Staff/detail";

export const userRoutes: RouteConfig[] = [
  {
    path: "tenant",
    Component: Tenant,
    children: [{ path: "detailTenant/:id", Component: DetailTenant }],
  },
  {
    path: "manager",
    Component: Manager,
    children: [{ path: "detailManager/:id", Component: DetailManager }],
  },
  {
    path: "staff",
    Component: Staff,
    children: [{ path: "detailStaff/:id", Component: DetailStaff }],
  },
];
