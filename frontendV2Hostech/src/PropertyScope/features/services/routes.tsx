import type { RouteObject } from 'react-router-dom';
import ServiceListPage from './pages/ServiceListPage';
import ServiceCreatePage from './pages/ServiceCreatePage';
import ServiceEditPage from './pages/ServiceEditPage';

export const serviceRoutes: RouteObject[] = [
  {
    path: 'services',
    element: <ServiceListPage />,
  },
  {
    path: 'services/create',
    element: <ServiceCreatePage />,
  },
  {
    path: 'services/:serviceId/edit',
    element: <ServiceEditPage />,
  },
];
