import type { RouteConfig } from "../../shared/types/navigation";
import Contracts from "./pages/Contracts";
import CreateContract from "./pages/Create";
import EditContract from "./pages/Edit";
import ContractDetail from "./pages/Detail";
import DeletedContracts from "./pages/DeletedContracts";

export const contractRoutes: RouteConfig = {
  path: "contracts",
  Component: Contracts,
  children: [
    { path: "create", Component: CreateContract },
    { path: "edit/:id", Component: EditContract },
    { path: "detail/:id", Component: ContractDetail },
    { path: "deleted", Component: DeletedContracts },
  ],
};
