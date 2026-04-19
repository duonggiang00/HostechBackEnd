import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const MyRoomPage = lazy(() => import('./pages/MyRoomPage'));

export const roomsRoutes: RouteObject[] = [
  {
    path: 'my-room',
    element: <MyRoomPage />,
  },
];
