import type { RouteConfig } from "../../shared/types/navigation";
import DashboardPage from "./pages/DashboardPage";

export const dashboardRoutes: RouteConfig[] = [
  {
    path: "",
    Component: DashboardPage,
  },
];
