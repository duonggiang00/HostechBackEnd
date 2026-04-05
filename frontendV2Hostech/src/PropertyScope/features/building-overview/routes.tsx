import type { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const BuildingOverviewPage = lazy(() => import('./pages/BuildingOverviewPage'));

export const buildingOverviewRoutes: RouteObject[] = [
  {
    path: 'building-view',
    element: <BuildingOverviewPage />,
  },
];
