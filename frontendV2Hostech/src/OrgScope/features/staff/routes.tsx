import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const StaffPage = lazy(() => import('./pages/StaffPage'));

export const staffRoutes: RouteObject[] = [
  {
    path: 'staff',
    element: <StaffPage />,
  },
];
