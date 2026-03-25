import type { RouteObject } from 'react-router-dom';
import TicketListPage from './pages/TicketListPage';

export const ticketRoutes: RouteObject[] = [
  {
    path: 'tickets',
    element: <TicketListPage />,
  },
];
