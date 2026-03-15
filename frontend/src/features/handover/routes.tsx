import type { RouteConfig } from "../../shared/types/navigation";
import HandoverList from "./pages/HandoverList";

export const handoverRoutes: RouteConfig[] = [
  {
    path: "handovers",
    Component: HandoverList,
  },
];
