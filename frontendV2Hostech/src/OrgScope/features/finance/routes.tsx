import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const FinanceDashboard = lazy(() => import('./pages/FinanceDashboard'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));

/** /org/dashboard, /org/finance — cùng OrgScopeLayout (Org Console). */
export const orgFinanceConsoleRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <FinanceDashboard />,
  },
  {
    path: 'finance',
    element: <FinanceDashboard />,
  },
];

/** Các trang org tài chính còn lại dùng OrgScopeLayout sáng. */
export const orgFinanceInvoicesRoutes: RouteObject[] = [
  {
    path: 'invoices',
    element: <InvoicesPage />,
  },
];

/** Gộp đầy đủ (ví dụ tham chiếu tài liệu); router dùng tách console + classic. */
export const financeRoutes: RouteObject[] = [...orgFinanceConsoleRoutes, ...orgFinanceInvoicesRoutes];
