import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const PendingContractsPage = lazy(() => import('./pages/PendingContractsPage'));
const TenantContractDetailPage = lazy(() => import('./pages/TenantContractDetailPage'));

export const contractsRoutes: RouteObject[] = [
  {
    path: 'contracts/pending',
    element: <PendingContractsPage />,
  },
  {
    path: 'contracts/:id',
    element: <TenantContractDetailPage />,
  },
];
