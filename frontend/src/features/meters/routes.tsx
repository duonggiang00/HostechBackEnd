import MeterList from "./pages/MeterList";
import type { RouteConfig } from "../../shared/types/navigation";

export const meterRoutes: RouteConfig[] = [
  {
    path: "meters",
    Component: MeterList,
  },
];
