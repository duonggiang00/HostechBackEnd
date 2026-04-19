import type { RouteObject } from 'react-router-dom';
import ServiceListPage from './pages/ServiceListPage';
import ServiceFormPage from './pages/ServiceFormPage';

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
