import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { propertiesRoutes } from './features/properties/routes';
import { orgFinanceInvoicesRoutes } from './features/finance/routes';
import { staffRoutes } from './features/staff/routes';
import { governanceRoutes } from './features/governance/routes';

const ProfilePage = lazy(() => import('@/shared/features/profile/pages/ProfilePage'));

/**
 * Các route /org/* dùng OrgScopeLayout (sidebar sáng + header + breadcrumb).
 * /org/dashboard và /org/finance được khai báo riêng trong routes/index.tsx với OrgFinanceConsoleLayout.
 */
export const orgClassicScopeRoutes: RouteObject[] = [
  ...propertiesRoutes,
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
