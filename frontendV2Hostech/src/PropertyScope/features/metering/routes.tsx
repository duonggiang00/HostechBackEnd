import type { RouteObject } from 'react-router-dom';
import MeterListPage from './pages/MeterListPage';
import QuickReadingPage from './pages/QuickReadingPage';
import MeterDetailPage from './pages/MeterDetailPage';
import RoomMeterDetailPage from './pages/RoomMeterDetailPage';

export const meteringRoutes: RouteObject[] = [
  {
    path: 'meters',
    element: <MeterListPage />,
  },
  {
    path: 'meters/quick',
    element: <QuickReadingPage />,
  },
  {
    path: 'meters/quick-reading',
    element: <QuickReadingPage />,
  },
  {
    path: 'meters/room/:roomId',
    element: <RoomMeterDetailPage />,
  },
  {
    path: 'meters/:meterId',
    element: <MeterDetailPage />,
  },
];
