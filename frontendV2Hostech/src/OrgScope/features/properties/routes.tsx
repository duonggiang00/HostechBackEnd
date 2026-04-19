import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const PropertyForm = lazy(() => import('./pages/PropertyForm'));

export const propertiesRoutes: RouteObject[] = [
  {
    path: 'properties',
    element: <PropertiesPage />,
  },
  {
    path: 'properties/add',
    element: <PropertyForm />,
  },
  {
    path: 'properties/:id/edit',
    element: <PropertyForm />,
  },
];
