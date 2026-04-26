import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { propertiesRoutes } from './features/properties/routes';
import { financeRoutes } from './features/finance/routes';
import { staffRoutes } from './features/staff/routes';

const ProfilePage = lazy(() => import('@/shared/features/profile/pages/ProfilePage'));

export const orgScopeRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="dashboard" replace />,
  },
  ...propertiesRoutes,
  ...financeRoutes,
  ...staffRoutes,
  {
    path: 'profile',
    element: <ProfilePage />,
  },
];
