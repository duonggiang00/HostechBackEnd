import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PropertyManagerFeatureRoute } from '@/shared/components/routing/PropertyManagerFeatureRoute';

const PropertyInvoicesPage = lazy(() => import('./pages/PropertyInvoicesPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const InvoiceDetailPage = lazy(() => import('./pages/InvoiceDetailPage'));
const CreateQuickInvoicePage = lazy(() => import('./pages/CreateQuickInvoicePage'));
const PaymentVerificationPage = lazy(() => import('./pages/PaymentVerificationPage'));

export const billingRoutes: RouteObject[] = [
  {
    path: 'billing',
    element: <PropertyInvoicesPage />,
  },
  {
    path: 'billing/quick-invoice',
    element: <CreateQuickInvoicePage />,
  },
  {
    path: 'billing/quick-invoice/:roomId',
    element: <CreateQuickInvoicePage />,
  },
  {
    path: 'billing/invoices/:invoiceId',
    element: <InvoiceDetailPage />,
  },
  {
    path: 'billing/payment-verifications',
    element: (
      <PropertyManagerFeatureRoute>
        <PaymentVerificationPage />
      </PropertyManagerFeatureRoute>
    ),
  },
  {
    path: 'invoices',
    element: <PropertyInvoicesPage />,
  },
  {
    path: 'invoices/:invoiceId',
    element: <InvoiceDetailPage />,
  },
  {
    path: 'expenses',
    element: <ExpensesPage />,
  },
];
