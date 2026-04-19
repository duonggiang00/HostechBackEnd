import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const TenantDashboard = lazy(() => import('./pages/TenantDashboard'));

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <TenantDashboard />,
  },
];
