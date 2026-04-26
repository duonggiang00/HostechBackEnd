import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { billingRoutes } from './features/billing/routes';
import { contractsRoutes } from './features/contracts/routes';
import { dashboardRoutes } from './features/dashboard/routes';
import { meteringRoutes } from './features/metering/routes';
import { serviceRoutes } from './features/services/routes';
import { ticketRoutes } from './features/tickets/routes';
import { usersRoutes } from './features/users/routes';
import { propertyRoutes } from './features/properties/routes';

import { roomRoutes } from './features/rooms/routes';

const ProfilePage = lazy(() => import('@/shared/features/profile/pages/ProfilePage'));

export const propertyScopeRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="dashboard" replace />,
  },
  ...propertyRoutes,

  ...roomRoutes,
  ...dashboardRoutes,
  ...billingRoutes,
  ...contractsRoutes,
  ...meteringRoutes,
  ...serviceRoutes,
  ...ticketRoutes,
  ...usersRoutes,
  {
    path: 'profile',
    element: <ProfilePage />,
  },
];
