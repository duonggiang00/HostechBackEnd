import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const ServiceListPage = lazy(() => import('./pages/ServiceListPage'));
const ServiceFormPage = lazy(() => import('./pages/ServiceFormPage'));

export const serviceRoutes: RouteObject[] = [
  {
    path: 'services',
    element: <ServiceListPage />,
  },
  {
    path: 'services/create',
    element: <ServiceFormPage />,
  },
  {
    path: 'services/:serviceId/edit',
    element: <ServiceFormPage />,
  },
];
