import type { RouteObject } from 'react-router-dom';
import { PropertyInvoicesPage } from './pages/PropertyInvoicesPage';
import { ExpensesPage } from './pages/ExpensesPage';

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
