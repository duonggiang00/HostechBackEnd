import type { RouteConfig } from "../../shared/types/navigation";
import Properties from "./pages/Property/Properties";
import CreateProperty from "./pages/Property/Create";
import EditProperty from "./pages/Property/edit";
import DetailProperty from "./pages/Property/detail";
import Orgs from "./pages/Orgs/Orgs";
import CreateOrg from "./pages/Orgs/create";
import EditOrg from "./pages/Orgs/edit";
import DetailOrg from "./pages/Orgs/detail";
import Floors from "./pages/Floors/Floors";
import CreateFloor from "./pages/Floors/create";
import EditFloor from "./pages/Floors/edit";
import DetailFloor from "./pages/Floors/detail";
import Rooms from "./pages/Rooms/Rooms";
import CreateRoom from "./pages/Rooms/create";
import EditRoom from "./pages/Rooms/edit";
import DetailRoom from "./pages/Rooms/detail";
import Meters from "./pages/Meters/Meters";
import CreateMeter from "./pages/Meters/create";
import EditMeter from "./pages/Meters/edit";
import DetailMeter from "./pages/Meters/detail";

export const propertyRoutes: RouteConfig[] = [
  {
    path: "properties",
    Component: Properties,
    children: [
      { path: "createProperty", Component: CreateProperty },
      { path: "editProperty/:id", Component: EditProperty },
      { path: "detailProperty/:id", Component: DetailProperty },
    ],
  },
  {
    path: "orgs",
    Component: Orgs,
    children: [
      { path: "createOrg", Component: CreateOrg },
      { path: "editOrg/:id", Component: EditOrg },
      { path: "detailOrg/:id", Component: DetailOrg },
    ],
  },
  {
    path: "floors",
    Component: Floors,
    children: [
      { path: "createFloor", Component: CreateFloor },
      { path: "editFloor/:id", Component: EditFloor },
      { path: "detailFloor/:id", Component: DetailFloor },
    ],
  },
  {
    path: "rooms",
    Component: Rooms,
    children: [
      { path: "createRoom", Component: CreateRoom },
      { path: "editRoom/:id", Component: EditRoom },
      { path: "detailRoom/:id", Component: DetailRoom },
    ],
  },
  {
    path: "meters",
    Component: Meters,
    children: [
      { path: "createMeter", Component: CreateMeter },
      { path: "editMeter/:id", Component: EditMeter },
      { path: "detailMeter/:id", Component: DetailMeter },
    ],
  },
];
