import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const TenantBillingPage = lazy(() => import('./pages/TenantBillingPage'));
const TenantVnpayReturnPage = lazy(() => import('./pages/TenantVnpayReturnPage'));

export const billingRoutes: RouteObject[] = [
  {
    path: 'billing',
    element: <TenantBillingPage />,
  },
  {
    path: 'billing/vnpay-return',
    element: <TenantVnpayReturnPage />,
  },
];
