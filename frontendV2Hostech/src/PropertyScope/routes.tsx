import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import PropertyScopeIndexRedirect from './PropertyScopeIndexRedirect';
import { billingRoutes } from './features/billing/routes';
import { contractsRoutes } from './features/contracts/routes';
import { dashboardRoutes } from './features/dashboard/routes';
import { financeRoutes } from './features/finance/routes';
import { meteringRoutes } from './features/metering/routes';
import { operationsRoutes } from './features/operations/routes';
import { serviceRoutes } from './features/services/routes';
import { ticketRoutes } from './features/tickets/routes';
import { usersRoutes } from './features/users/routes';
import { propertyRoutes } from './features/properties/routes';

import { roomRoutes } from './features/rooms/routes';

const ProfilePage = lazy(() => import('@/shared/features/profile/pages/ProfilePage'));

export const propertyScopeRoutes: RouteObject[] = [
  {
    index: true,
    element: <PropertyScopeIndexRedirect />,
  },
  ...propertyRoutes,

  ...roomRoutes,
  ...dashboardRoutes,
  ...billingRoutes,
  ...contractsRoutes,
  ...financeRoutes,
  ...meteringRoutes,
  ...operationsRoutes,
  ...serviceRoutes,
  ...ticketRoutes,
  ...usersRoutes,
  {
    path: 'profile',
    element: <ProfilePage />,
  },
];
