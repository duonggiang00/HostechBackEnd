import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const TenantBillingPage = lazy(() => import('./pages/TenantBillingPage'));
const TenantPaymentsPage = lazy(() => import('./pages/TenantPaymentsPage'));
const TenantVnpayReturnPage = lazy(() => import('./pages/TenantVnpayReturnPage'));

export const billingRoutes: RouteObject[] = [
  {
    path: 'billing/transactions',
    element: <TenantPaymentsPage />,
  },
  {
    path: 'billing',
    element: <TenantBillingPage />,
  },
  {
    path: 'billing/vnpay-return',
    element: <TenantVnpayReturnPage />,
  },
];
