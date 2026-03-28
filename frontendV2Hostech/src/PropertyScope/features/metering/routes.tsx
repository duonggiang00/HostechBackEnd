import type { RouteObject } from 'react-router-dom';
import MeterListPage from './pages/MeterListPage';
import QuickReadingPage from './pages/QuickReadingPage';
import MeterDetailPage from './pages/MeterDetailPage';

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
    path: 'meters/:meterId',
    element: <MeterDetailPage />,
  },
];
