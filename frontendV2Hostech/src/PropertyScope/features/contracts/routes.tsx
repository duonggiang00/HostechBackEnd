import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const ContractListPage = lazy(() => import('./pages/ContractListPage'));
const ContractCreatePage = lazy(() => import('./pages/ContractCreatePage'));
const ContractDetailPage = lazy(() => import('./pages/ContractDetailPage'));
const ContractDocumentViewPage = lazy(() => import('./pages/ContractDocumentViewPage'));
const ContractEditPage = lazy(() => import('./pages/ContractEditPage'));
const ContractTerminatePage = lazy(() => import('./pages/ContractTerminatePage'));

export const contractsRoutes: RouteObject[] = [
  {
    path: 'contracts',
    element: <ContractListPage />,
  },
  {
    path: 'contracts/create',
    element: <ContractCreatePage />,
  },
  {
    path: 'contracts/:contractId',
    element: <ContractDetailPage />,
  },
  {
    path: 'contracts/:contractId/edit',
    element: <ContractEditPage />,
  },
  {
    path: 'contracts/:contractId/terminate',
    element: <ContractTerminatePage />,
  },
  {
    path: 'contracts/:contractId/view',
    element: <ContractDocumentViewPage />,
  },
];
