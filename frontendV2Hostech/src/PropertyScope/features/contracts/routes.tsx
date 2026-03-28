import type { RouteObject } from 'react-router-dom';
import ContractListPage from './pages/ContractListPage';
import ContractCreatePage from './pages/ContractCreatePage';
import ContractDetailPage from './pages/ContractDetailPage';

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
];
