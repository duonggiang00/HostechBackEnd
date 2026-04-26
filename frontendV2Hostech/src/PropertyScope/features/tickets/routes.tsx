import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const TicketListPage = lazy(() => import('./pages/TicketListPage'));

export const ticketRoutes: RouteObject[] = [
  {
    path: 'tickets',
    element: <TicketListPage />,
  },
];
