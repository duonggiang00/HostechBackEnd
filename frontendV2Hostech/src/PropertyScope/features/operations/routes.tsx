import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PropertyManagerFeatureRoute } from '@/shared/components/routing/PropertyManagerFeatureRoute';

const HandoverListPage = lazy(() => import('./pages/HandoverListPage'));
const RequestListPage = lazy(() => import('./pages/RequestListPage'));

export const operationsRoutes: RouteObject[] = [
  {
    path: 'handovers',
    element: <HandoverListPage />,
  },
  {
    path: 'requests',
    element: (
      <PropertyManagerFeatureRoute>
        <RequestListPage />
      </PropertyManagerFeatureRoute>
    ),
  },
];
