import type { RouteObject } from 'react-router-dom';

import PropertyDetailPage from '../pages/PropertyDetailPage';

export const propertyRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <PropertyDetailPage />,
  },
  {
    path: 'building-view',
    element: <PropertyDetailPage />,
  },
  {
    path: 'rooms',
    element: <PropertyDetailPage />,
  },
];
