import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const MeterListPage = lazy(() => import('./pages/MeterListPage'));
const QuickReadingPage = lazy(() => import('./pages/QuickReadingPage'));
const MeterDetailPage = lazy(() => import('./pages/MeterDetailPage'));
const RoomMeterDetailPage = lazy(() => import('./pages/RoomMeterDetailPage'));
const GlobalMeterReadingPage = lazy(() => import('./pages/GlobalMeterReadingPage'));

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
    // Trang lịch sử chốt số tổng (toàn bộ tài sản)
    path: 'meters/history',
    element: <GlobalMeterReadingPage />,
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
