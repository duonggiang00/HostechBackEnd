import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const PropertyInvoicesPage = lazy(() => import('./pages/PropertyInvoicesPage').then(module => ({ default: module.PropertyInvoicesPage })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then(module => ({ default: module.ExpensesPage })));

export const billingRoutes: RouteObject[] = [
  {
    path: 'billing',
    element: <PropertyInvoicesPage />,
  },
  {
    path: 'invoices',
    element: <PropertyInvoicesPage />,
  },
  {
    path: 'expenses',
    element: <ExpensesPage />,
  },
];
