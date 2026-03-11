import { lazy } from 'react';
import type { RouteConfig } from '../../shared/types/navigation';
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute';

const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage').then(module => ({ default: module.AuditLogsPage })));

export const systemRoutes: RouteConfig = {
  path: 'audit-logs',
  Component: () => (
    <ProtectedRoute allowedRoles={['Owner']}>
      <AuditLogsPage />
    </ProtectedRoute>
  ),
};
