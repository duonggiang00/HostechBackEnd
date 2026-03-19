import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

// Layouts
import AdminSystemLayout from '@/adminSystem/layouts/AdminSystemLayout';
import OrgScopeLayout from '@/OrgScope/layouts/OrgScopeLayout';
import PropertyScopeLayout from '@/PropertyScope/layouts/PropertyScopeLayout';
import TenantLayout from '@/Tenant/layouts/TenantLayout';
import SuperAdminLayout from '@/adminSystem/layouts/SuperAdminLayout';

// Public & Auth Pages
import LoginPage from '@/shared/features/auth/components/LoginPage';
import InvitationSetupPage from '@/shared/features/auth/components/InvitationSetupPage';

// Admin Pages
import PropertiesPage from '@/OrgScope/features/properties/pages/PropertiesPage';
import OrganizationsPage from '@/adminSystem/features/organizations/pages/OrganizationsPage';
import FloorsPage from '@/PropertyScope/features/floors/pages/FloorsPage';
import FloorPlanPage from '@/PropertyScope/features/floors/pages/FloorPlanPage';
import RoomListPage from '@/PropertyScope/features/rooms/pages/RoomListPage';
import RoomCreatePage from '@/PropertyScope/features/rooms/pages/RoomCreatePage';
import RoomEditPage from '@/PropertyScope/features/rooms/pages/RoomEditPage';
import RoomDetailPage from '@/PropertyScope/features/rooms/pages/RoomDetailPage';
import InvoicesPage from '@/OrgScope/features/finance/pages/InvoicesPage';
import FinanceDashboard from '@/OrgScope/features/finance/pages/FinanceDashboard';
import DashboardPage from '@/adminSystem/features/dashboard/pages/DashboardPage';
import StaffPage from '@/OrgScope/features/staff/pages/StaffPage';
import AuditLogPage from '@/adminSystem/features/auditLogs/pages/AuditLogPage';
import SessionsPage from '@/adminSystem/features/sessions/pages/SessionsPage';
import AdminCommunicationPage from '@/adminSystem/features/dashboard/pages/AdminCommunicationPage';
import PropertyForm from '@/OrgScope/features/properties/pages/PropertyForm';
import PropertyDashboard from '@/PropertyScope/features/dashboard/pages/PropertyDashboard';
import SelectPropertyPage from '@/PropertyScope/features/select-property/pages/SelectPropertyPage';
import MeterListPage from '@/PropertyScope/features/metering/pages/MeterListPage';
import MeterDetailPage from '@/PropertyScope/features/metering/pages/MeterDetailPage';

// Tenant Pages
import TenantDashboard from '@/Tenant/features/dashboard/pages/TenantDashboard';
import TenantRequestsPage from '@/Tenant/features/requests/pages/TenantRequestsPage';
import TenantMessagingPage from '@/Tenant/features/messaging/pages/TenantMessagingPage';
import TenantBillingPage from '@/Tenant/features/billing/pages/TenantBillingPage';

/**
 * 1. ProtectedRoute: Checks if user is logged in, and if they hold an allowed role.
 */
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

/**
 * 2. RootRedirect: The primary routing decision maker.
 * Analyzes the user's role and redirects them to their primary layout/dashboard.
 */
const RootRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'Admin':
      return <Navigate to="/system/dashboard" replace />;

    case 'Owner':
      return <Navigate to="/org/dashboard" replace />;
    
    case 'Manager':
    case 'Staff': {
      return <Navigate to="/org-select" replace />;
    }

    case 'Tenant':
      return <Navigate to="/app/dashboard" replace />;

    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

/**
 * 3. AppRoutes: Centralized application router defining layout boundaries.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* --- Public & Auth Routes --- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup-account/:token" element={<InvitationSetupPage />} />
      <Route path="/unauthorized" element={
        <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Unauthorized Access</h1>
          <p className="text-slate-500 text-center max-w-md">You do not have the required permissions to view this page. Please contact your administrator.</p>
        </div>
      } />

      {/* --- Root Entry Point: handles role routing --- */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/admin" element={<Navigate to="/" replace />} />
      <Route path="/org-select" element={<ProtectedRoute><OrgSelectionPage /></ProtectedRoute>} />

      {/* --- Super Admin Portal (Legacy/Specialized) --- */}
      <Route 
        path="/super-admin/*" 
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <SuperAdminLayout>
              <Routes>
                <Route index element={<div>Super Admin Dashboard</div>} />
                <Route path="organizations" element={<div>Organization Management</div>} />
              </Routes>
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />

      {/* 1. Admin System Scope Layout */}
      <Route 
        path="/system"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminSystemLayout><Outlet /></AdminSystemLayout>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="audit-logs" element={<AuditLogPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="communication" element={<AdminCommunicationPage />} />
        <Route path="settings" element={<div>System Settings</div>} />
      </Route>

      {/* 2. Organization Scope Layout — Owner & Manager (and Staff optionally for lists) */}
      <Route 
        path="/org"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Owner', 'Manager', 'Staff']}>
            <OrgScopeLayout><Outlet /></OrgScopeLayout>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={['Admin', 'Owner']}><FinanceDashboard /></ProtectedRoute>} />
        <Route path="organizations/:orgId/properties" element={<ProtectedRoute allowedRoles={['Admin']}><PropertiesPage /></ProtectedRoute>} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="properties/add" element={<ProtectedRoute allowedRoles={['Admin', 'Owner', 'Manager']}><PropertyForm /></ProtectedRoute>} />
        <Route path="properties/:id/edit" element={<ProtectedRoute allowedRoles={['Admin', 'Owner', 'Manager']}><PropertyForm /></ProtectedRoute>} />
        <Route path="staff" element={<ProtectedRoute allowedRoles={['Admin', 'Owner']}><StaffPage /></ProtectedRoute>} />
        <Route path="finance" element={<ProtectedRoute allowedRoles={['Admin', 'Owner']}><FinanceDashboard /></ProtectedRoute>} />
        <Route path="invoices" element={<ProtectedRoute allowedRoles={['Admin', 'Owner']}><InvoicesPage /></ProtectedRoute>} />
      </Route>

      {/* 3. Property Scope Layout — Admin, Owner, Manager, Staff */}
      <Route 
        path="/properties/:propertyId"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Owner', 'Manager', 'Staff']}>
            <PropertyScopeLayout><Outlet /></PropertyScopeLayout>
          </ProtectedRoute>
<<<<<<< Updated upstream
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PropertyDashboard />} />
        <Route path="floors" element={<FloorsPage />} />
        <Route path="floors/:floorId/rooms" element={<FloorPlanPage />} />
        <Route path="floors/:floorId/rooms/create" element={<RoomCreatePage />} />
        <Route path="floors/:floorId/rooms/:roomId" element={<RoomDetailPage />} />
        <Route path="floors/:floorId/rooms/:roomId/edit" element={<RoomEditPage />} />
        <Route path="rooms" element={<RoomListPage />} />
        <Route path="rooms/create" element={<RoomCreatePage />} />
        <Route path="rooms/:roomId" element={<RoomDetailPage />} />
        <Route path="rooms/:roomId/edit" element={<RoomEditPage />} />
=======
        }>
          <Route path="properties/:propertyId/dashboard" element={<PropertyDashboard />} />
          <Route path="properties/:propertyId/floors" element={<FloorsPage />} />
          <Route path="properties/:propertyId/floors/:floorId/rooms" element={<FloorPlanPage />} />
          <Route path="properties/:propertyId/floors/:floorId/rooms/create" element={<RoomCreatePage />} />
          <Route path="properties/:propertyId/floors/:floorId/rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="properties/:propertyId/floors/:floorId/rooms/:roomId/edit" element={<RoomEditPage />} />
          <Route path="properties/:propertyId/rooms" element={<RoomListPage />} />
          <Route path="properties/:propertyId/rooms/create" element={<RoomCreatePage />} />
          <Route path="properties/:propertyId/rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="properties/:propertyId/rooms/:roomId/edit" element={<RoomEditPage />} />
          <Route path="rooms" element={<RoomListPage />} />
          <Route path="properties/:propertyId/meters" element={<MeterListPage />} />
          <Route path="properties/:propertyId/meters/:meterId" element={<MeterDetailPage />} />
          {/* Manager/Staff with multiple properties → pick one */}
          <Route path="select-property" element={<SelectPropertyPage />} />
        </Route>
>>>>>>> Stashed changes
      </Route>

      {/* --- Tenant App Portal --- */}
      <Route 
        path="/app" 
        element={
          <ProtectedRoute allowedRoles={['Tenant']}>
            <TenantLayout>
              <Outlet />
            </TenantLayout>
          </ProtectedRoute>
        } 
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TenantDashboard />} />
        <Route path="requests" element={<TenantRequestsPage />} />
        <Route path="messages" element={<TenantMessagingPage />} />
        <Route path="billing" element={<TenantBillingPage />} />
        <Route path="news" element={<div className="p-8 text-center text-slate-400">Announcements Coming Soon</div>} />
        <Route path="profile" element={<div className="p-8 text-center text-slate-400">Profile Settings Coming Soon</div>} />
      </Route>

      {/* --- Fallback Route --- */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
