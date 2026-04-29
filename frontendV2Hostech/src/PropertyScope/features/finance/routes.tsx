import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PropertyManagerFeatureRoute } from '@/shared/components/routing/PropertyManagerFeatureRoute';

const PaymentsPage = lazy(() =>
  import('./pages/PaymentsPage').then((m) => ({ default: m.PaymentsPage })),
);
const PaymentDetailPage = lazy(() => import('./pages/PaymentDetailPage'));
const LedgerPage = lazy(() =>
  import('./pages/LedgerPage').then((m) => ({ default: m.LedgerPage })),
);

export const financeRoutes: RouteObject[] = [
  {
    path: 'finance/payments',
    element: (
      <PropertyManagerFeatureRoute>
        <PaymentsPage />
      </PropertyManagerFeatureRoute>
    ),
  },
  {
    path: 'finance/payments/:paymentId',
    element: (
      <PropertyManagerFeatureRoute>
        <PaymentDetailPage />
      </PropertyManagerFeatureRoute>
    ),
  },
  {
    path: 'finance/ledger',
    element: (
      <PropertyManagerFeatureRoute>
        <LedgerPage />
      </PropertyManagerFeatureRoute>
    ),
  },
];
