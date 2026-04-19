import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { dashboardRoutes } from './features/dashboard/routes';
import { requestsRoutes } from './features/requests/routes';
import { messagingRoutes } from './features/messaging/routes';
import { billingRoutes } from './features/billing/routes';
import { contractsRoutes } from './features/contracts/routes';
import { buildingOverviewRoutes } from './features/building-overview/routes';

export const tenantScopeRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="dashboard" replace />,
  },
  ...dashboardRoutes,
  ...requestsRoutes,
  ...messagingRoutes,
  ...billingRoutes,
  ...contractsRoutes,
  ...buildingOverviewRoutes,
  {
    path: 'news',
    element: (
      <div className="p-8 text-center text-slate-400">
        <p className="text-lg font-bold">Thông báo</p>
        <p className="text-sm">Tính năng đang được phát triển và sẽ sớm ra mắt.</p>
      </div>
    ),
  },
];
