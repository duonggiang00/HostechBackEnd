import { ProtectedRoute } from '../auth/components/ProtectedRoute';
import { UserManager } from './pages/UserManager';
import { UserInvitePage } from './pages/UserInvitePage';
import type { RouteConfig } from '../../shared/types/navigation';

export const userRoutes: RouteConfig[] = [
    {
        path: 'users',
        Component: () => <ProtectedRoute allowedRoles={['Admin', 'Owner', 'Manager', 'Staff']}><UserManager /></ProtectedRoute>,
    },
    {
        path: 'users/invite',
        Component: () => <ProtectedRoute allowedRoles={['Admin', 'Owner', 'Manager']}><UserInvitePage /></ProtectedRoute>,
    }
];
