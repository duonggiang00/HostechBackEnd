import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { propertiesRoutes } from './features/properties/routes';
import { orgRoomsRoutes } from './features/rooms/routes';
import { orgFinanceInvoicesRoutes } from './features/finance/routes';
import { staffRoutes } from './features/staff/routes';
import { governanceRoutes } from './features/governance/routes';

const ProfilePage = lazy(() => import('@/shared/features/profile/pages/ProfilePage'));

/**
 * Các route /org/* dùng OrgScopeLayout (sidebar sáng + header + breadcrumb).
 * /org/dashboard và /org/finance được map trong routes/index.tsx cùng OrgScopeLayout.
 */
export const orgClassicScopeRoutes: RouteObject[] = [
  ...propertiesRoutes,
  ...orgRoomsRoutes,
  ...orgFinanceInvoicesRoutes,
  ...staffRoutes,
  ...governanceRoutes,
  {
    path: 'profile',
    element: <ProfilePage />,
  },
];

/** @deprecated Dùng orgClassicScopeRoutes; giữ tên để tránh nhầm khi đọc diff cũ. */
export const orgScopeRoutes = orgClassicScopeRoutes;
