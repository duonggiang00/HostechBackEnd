import type { RouteObject } from 'react-router-dom';
import { PropertyInvoicesPage } from './pages/PropertyInvoicesPage';

export const billingRoutes: RouteObject[] = [
  {
    path: 'billing',
    element: <PropertyInvoicesPage />,
  },
];
