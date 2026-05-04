import { Navigate, useParams } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const TenantTicketsPage = lazy(() => import('./pages/TenantTicketsPage'));
const TenantTicketDetailPage = lazy(
  () => import('./pages/TenantTicketDetailPage'),
);

const withSuspense = (children: React.ReactNode) => (
  <Suspense fallback={null}>{children}</Suspense>
);

/**
 * Forward `/app/requests/:ticketId` → `/app/tickets/:ticketId` mà vẫn giữ ID,
 * đảm bảo deep link cũ trỏ đúng ticket.
 */
function LegacyRequestDetailRedirect() {
  const { ticketId } = useParams<{ ticketId?: string }>();
  if (!ticketId) {
    return <Navigate to="/app/tickets" replace />;
  }
  return <Navigate to={`/app/tickets/${ticketId}`} replace />;
}

/**
 * Routes mới chính thức cho ticket Tenant. Dùng prefix `/app/tickets`.
 */
export const ticketsRoutes: RouteObject[] = [
  {
    path: 'tickets',
    element: withSuspense(<TenantTicketsPage />),
  },
  {
    path: 'tickets/:ticketId',
    element: withSuspense(<TenantTicketDetailPage />),
  },
];

/**
 * Alias để giữ tương thích link cũ `/app/requests` → `/app/tickets`.
 * Đảm bảo bookmark / email cũ của cư dân vẫn hoạt động.
 */
export const legacyRequestsRoutes: RouteObject[] = [
  {
    path: 'requests',
    element: <Navigate to="/app/tickets" replace />,
  },
  {
    path: 'requests/:ticketId',
    element: <LegacyRequestDetailRedirect />,
  },
];
