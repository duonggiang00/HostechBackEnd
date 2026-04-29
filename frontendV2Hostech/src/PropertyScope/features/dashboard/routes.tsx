import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const PropertyDashboardPage = lazy(() => import('./pages/PropertyDashboardPage'));
const StaffHomePage = lazy(() => import('./pages/StaffHomePage'));

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <PropertyDashboardPage />,
  },
  {
    path: 'staff-home',
    element: <StaffHomePage />,
  },
];
