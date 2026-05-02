import { lazy } from 'react';
import { Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { PropertyManagerFeatureRoute } from '@/shared/components/routing/PropertyManagerFeatureRoute';

const HandoverListPage = lazy(() => import('./pages/HandoverListPage'));
const HandoverDetailPage = lazy(() => import('./pages/HandoverDetailPage'));
const RequestListPage = lazy(() => import('./pages/RequestListPage'));

/**
 * Lồng list + detail dưới một segment `handovers` để khớp chuẩn React Router
 * và tránh xung đột giữa hai route sibling `handovers` / `handovers/:id`.
 */
export const operationsRoutes: RouteObject[] = [
  {
    path: 'handovers',
    element: <Outlet />,
    children: [
      { index: true, element: <HandoverListPage /> },
      { path: ':handoverId', element: <HandoverDetailPage /> },
    ],
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
