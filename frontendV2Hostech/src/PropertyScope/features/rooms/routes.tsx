import type { RouteObject } from 'react-router-dom';
import RoomListPage from './pages/RoomListPage';
import RoomCreatePage from './pages/RoomCreatePage';
import RoomEditPage from './pages/RoomEditPage';
import RoomDetailPage from './pages/RoomDetailPage';
import { RoomTemplateCreatePage } from './pages/RoomTemplateCreatePage';

export const roomRoutes: RouteObject[] = [
  // Moved to propertyRoutes for unified navigation with tab switcher
  /*
  {
    path: 'rooms',
    element: <RoomListPage />,
  },
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
    path: 'rooms/templates/create',
    element: <RoomTemplateCreatePage />,
  },
  */
];
