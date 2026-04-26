import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const TenantRequestsPage = lazy(() => import('./pages/TenantRequestsPage'));

export const requestsRoutes: RouteObject[] = [
  {
    path: 'requests',
    element: <TenantRequestsPage />,
  },
];
