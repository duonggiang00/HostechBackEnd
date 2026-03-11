import type { RouteConfig } from "../../shared/types/navigation";
import Services from "./pages/Services";
import CreateService from "./pages/Create";
import EditService from "./pages/Edit";

export const serviceRoutes: RouteConfig = {
  path: "services",
  Component: Services,
  children: [
    { path: "createService", Component: CreateService },
    { path: "editService/:id", Component: EditService },
  ],
};
