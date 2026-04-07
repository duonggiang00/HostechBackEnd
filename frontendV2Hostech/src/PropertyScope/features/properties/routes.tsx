import type { RouteObject } from 'react-router-dom';

import PropertyDetailPage from './pages/PropertyDetailPage';

export const propertyRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <PropertyDetailPage defaultTab="dashboard" />,
  },
  {
    path: 'building-view',
    element: <PropertyDetailPage defaultTab="layout" />,
  },
  {
    path: 'rooms',
    element: <PropertyDetailPage defaultTab="rooms" />,
  },
];
