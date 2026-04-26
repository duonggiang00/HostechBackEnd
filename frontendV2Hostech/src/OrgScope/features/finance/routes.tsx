import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const FinanceDashboard = lazy(() => import('./pages/FinanceDashboard'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));

export const financeRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <FinanceDashboard />,
  },
  {
    path: 'finance',
    element: <FinanceDashboard />,
  },
  {
    path: 'invoices',
    element: <InvoicesPage />,
  },
];
