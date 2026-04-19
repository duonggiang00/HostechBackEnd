import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const TenantMessagingPage = lazy(() => import('./pages/TenantMessagingPage'));

export const messagingRoutes: RouteObject[] = [
  {
    path: 'messages',
    element: <TenantMessagingPage />,
  },
];
