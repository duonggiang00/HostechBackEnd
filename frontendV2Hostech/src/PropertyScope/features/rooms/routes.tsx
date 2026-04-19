import type { RouteObject } from 'react-router-dom';
import RoomCreatePage from './pages/RoomCreatePage';
import RoomEditPage from './pages/RoomEditPage';
import RoomDetailPage from './pages/RoomDetailPage';
import { RoomTemplateCreatePage } from './pages/RoomTemplateCreatePage';

export const roomRoutes: RouteObject[] = [
  {
    path: 'rooms/create',
    element: <RoomCreatePage />,
  },
  {
    path: 'rooms/:roomId',
    element: <RoomDetailPage />,
  },
  {
    path: 'rooms/:roomId/edit',
    element: <RoomEditPage />,
  },
  {
    path: 'room-templates/create',
    element: <RoomTemplateCreatePage />,
  },
];
