import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const TenantBuildingOverviewPage = lazy(() => import('./pages/TenantBuildingOverviewPage'));

export const buildingOverviewRoutes: RouteObject[] = [
  {
    path: 'building-overview',
    element: <TenantBuildingOverviewPage />,
  },
];
