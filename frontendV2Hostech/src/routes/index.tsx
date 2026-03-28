import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
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
import PropertyDetailPage from '@/PropertyScope/features/properties/pages/PropertyDetailPage';
import OrganizationsPage from '@/adminSystem/features/organizations/pages/OrganizationsPage';
import FloorsPage from '@/PropertyScope/features/floors/pages/FloorsPage';
import FloorPlanPage from '@/PropertyScope/features/floors/pages/FloorPlanPage';
import { TemplatesPage } from '@/PropertyScope/features/templates/pages/TemplatesPage';
import RoomListPage from '@/PropertyScope/features/rooms/pages/RoomListPage';
import RoomCreatePage from '@/PropertyScope/features/rooms/pages/RoomCreatePage';
import { PropertyInvoicesPage } from '@/PropertyScope/features/billing/pages/PropertyInvoicesPage';
import RoomEditPage from '@/PropertyScope/features/rooms/pages/RoomEditPage';
import RoomDetailPage from '@/PropertyScope/features/rooms/pages/RoomDetailPage';
import { RoomTemplateCreatePage } from '@/PropertyScope/features/rooms/pages/RoomTemplateCreatePage';
import InvoicesPage from '@/OrgScope/features/finance/pages/InvoicesPage';
import FinanceDashboard from '@/OrgScope/features/finance/pages/FinanceDashboard';
import DashboardPage from '@/adminSystem/features/dashboard/pages/DashboardPage';
import StaffPage from '@/OrgScope/features/staff/pages/StaffPage';
import AuditLogPage from '@/adminSystem/features/auditLogs/pages/AuditLogPage';
import SessionsPage from '@/adminSystem/features/sessions/pages/SessionsPage';
import AdminCommunicationPage from '@/adminSystem/features/dashboard/pages/AdminCommunicationPage';
import PropertyForm from '@/OrgScope/features/properties/pages/PropertyForm';
import OrgSelectionPage from '@/OrgScope/features/organizations/pages/OrgSelectionPage';
import MeterListPage from '@/PropertyScope/features/metering/pages/MeterListPage';
import MeterDetailPage from '@/PropertyScope/features/metering/pages/MeterDetailPage';
import QuickReadingPage from '@/PropertyScope/features/metering/pages/QuickReadingPage';
import ProfilePage from '@/shared/features/profile/pages/ProfilePage';
const ContractListPage = lazy(() => import('@/PropertyScope/features/contracts/pages/ContractListPage'));
const ContractCreatePage = lazy(() => import('@/PropertyScope/features/contracts/pages/ContractCreatePage'));
const ContractDetailPage = lazy(() => import('@/PropertyScope/features/contracts/pages/ContractDetailPage'));
const PropertyUsersPage = lazy(() => import('@/PropertyScope/features/users/pages/PropertyUsersPage'));
const CreateUserPage = lazy(() => import('@/PropertyScope/features/users/pages/CreateUserPage'));
const UserDetailPage = lazy(() => import('@/PropertyScope/features/users/pages/UserDetailPage'));
const TicketListPage = lazy(() => import('@/PropertyScope/features/tickets/pages/TicketListPage'));

// Tenant Pages
import TenantDashboard from '@/Tenant/features/dashboard/pages/TenantDashboard';
import TenantRequestsPage from '@/Tenant/features/requests/pages/TenantRequestsPage';
import TenantMessagingPage from '@/Tenant/features/messaging/pages/TenantMessagingPage';
import TenantBillingPage from '@/Tenant/features/billing/pages/TenantBillingPage';
const TenantVnpayReturnPage = lazy(() => import('@/Tenant/features/billing/pages/TenantVnpayReturnPage'));
const TenantPendingContractsPage = lazy(() => import('@/Tenant/features/contracts/pages/PendingContractsPage'));
const TenantContractDetailPage = lazy(() => import('@/Tenant/features/contracts/pages/TenantContractDetailPage'));

import SelectionLayout from '@/shared/layouts/SelectionLayout';
import PropertySelectionPage from '@/shared/features/properties/pages/PropertySelectionPage';

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
      // 1. If user has exactly one assigned property, jump straight to its dashboard (Property Scope)
      if (user.properties && user.properties.length === 1) {
        return <Navigate to={`/properties/${user.properties[0].id}/dashboard`} replace />;
      }
      
      // 2. If user has multiple properties or no specific assignment (but has an org),
      // navigate to the neutral property selection layout.
      if (user.org_id) {
         return <Navigate to="/select-property" replace />;
      }

      // Fallback
      return <Navigate to="/unauthorized" replace />;
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
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    }>
      <Routes>
        {/* --- Public & Auth Routes --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup-account/:token" element={<InvitationSetupPage />} />
        <Route path="/unauthorized" element={
          <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Truy cập không hợp lệ</h1>
            <p className="text-slate-500 text-center max-w-md">Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là một sai sót.</p>
          </div>
        } />

        {/* --- Root Entry Point: handles role routing --- */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route 
          path="/org-select" 
          element={
            <ProtectedRoute>
              <SelectionLayout title="Chọn tổ chức" subtitle="Chọn không gian làm việc bạn muốn quản lý hôm nay">
                <OrgSelectionPage />
              </SelectionLayout>
            </ProtectedRoute>
          } 
        />

        {/* --- Property Selection (Intermediate/Neutral Scope) --- */}
        <Route 
          path="/select-property" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Owner', 'Manager', 'Staff']}>
              <SelectionLayout title="Chọn cơ sở" subtitle="Hãy chọn một cơ sở để bắt đầu quản lý vận hành hàng ngày">
                <PropertySelectionPage />
              </SelectionLayout>
            </ProtectedRoute>
          } 
        />

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
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* 2. Organization Scope Layout — Owner & Admin ONLY (Managers/Staff use Selection Scope) */}
        <Route 
          path="/org"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Owner']}>
              <OrgScopeLayout><Outlet /></OrgScopeLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FinanceDashboard />} />
          <Route path="organizations/:orgId/properties" element={<ProtectedRoute allowedRoles={['Admin']}><PropertiesPage /></ProtectedRoute>} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/add" element={<PropertyForm />} />
          <Route path="properties/:id/edit" element={<PropertyForm />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="finance" element={<FinanceDashboard />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* 3. Property Scope Layout — Admin, Owner, Manager, Staff */}
        <Route 
          path="/properties/:propertyId"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Owner', 'Manager', 'Staff']}>
              <PropertyScopeLayout><Outlet /></PropertyScopeLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PropertyDetailPage defaultTab="dashboard" />} />
          <Route path="detail" element={<PropertyDetailPage defaultTab="info" />} />
          <Route path="floors" element={<FloorsPage />} />
          <Route path="floors/:floorId/rooms" element={<FloorPlanPage />} />
          <Route path="floors/:floorId/rooms/create" element={<RoomCreatePage />} />
          <Route path="floors/:floorId/rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="floors/:floorId/rooms/:roomId/edit" element={<RoomEditPage />} />
          <Route path="rooms" element={<RoomListPage />} />
          <Route path="rooms/create" element={<RoomCreatePage />} />
          <Route path="rooms/templates/create" element={<RoomTemplateCreatePage />} />
          <Route path="rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="rooms/:roomId/edit" element={<RoomEditPage />} />
          <Route path="meters" element={<MeterListPage />} />
          <Route path="meters/quick" element={<QuickReadingPage />} />
          <Route path="meters/quick-reading" element={<QuickReadingPage />} />
          <Route path="meters/:meterId" element={<MeterDetailPage />} />
          <Route path="contracts" element={<ContractListPage />} />
          <Route path="contracts/create" element={<ContractCreatePage />} />
          <Route path="contracts/:contractId" element={<ContractDetailPage />} />
          <Route path="billing" element={<PropertyInvoicesPage />} />
          <Route path="tickets" element={<TicketListPage />} />
          <Route path="users" element={<PropertyUsersPage />} />
          <Route path="users/create" element={<CreateUserPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="profile" element={<ProfilePage />} />
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
          <Route path="contracts/pending" element={<TenantPendingContractsPage />} />
          <Route path="contracts/:id" element={<TenantContractDetailPage />} />
          <Route path="news" element={
            <div className="p-8 text-center text-slate-400">
              <p className="text-lg font-bold">Thông báo</p>
              <p className="text-sm">Tính năng đang được phát triển và sẽ sớm ra mắt.</p>
            </div>
          } />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route
          path="/payment/vnpay/return"
          element={
            <ProtectedRoute allowedRoles={['Tenant']}>
              <TenantLayout>
                <TenantVnpayReturnPage />
              </TenantLayout>
            </ProtectedRoute>
          }
        />

        {/* --- Fallback Route --- */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  );
}
