import type { RouteConfig } from "../../shared/types/navigation";
import TicketList from "./pages/TicketList";

export const ticketRoutes: RouteConfig[] = [
  {
    path: "tickets",
    Component: TicketList,
  },
];
