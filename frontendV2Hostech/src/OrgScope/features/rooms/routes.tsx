import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const OrgRoomListPage = lazy(() => import('./pages/OrgRoomListPage'));
const OrgRoomEditPage = lazy(() => import('./pages/OrgRoomEditPage'));

export const orgRoomsRoutes: RouteObject[] = [
  {
    path: 'rooms',
    element: <OrgRoomListPage />,
  },
  {
    path: 'rooms/:roomId/edit',
    element: <OrgRoomEditPage />,
  },
];
