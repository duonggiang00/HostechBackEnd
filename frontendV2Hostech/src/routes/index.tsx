import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

// Layouts
import OrgScopeLayout from '@/OrgScope/layouts/OrgScopeLayout';
import PropertyScopeLayout from '@/PropertyScope/layouts/PropertyScopeLayout';
import TenantLayout from '@/Tenant/layouts/TenantLayout';
import SelectionLayout from '@/shared/layouts/SelectionLayout';

// Public & Auth Pages
import LoginPage from '@/shared/features/auth/components/LoginPage';
import InvitationSetupPage from '@/shared/features/auth/components/InvitationSetupPage';
import PropertySelectionPage from '@/shared/features/properties/pages/PropertySelectionPage';

// Modular Routes
import { orgScopeRoutes } from '@/OrgScope/routes';
import { propertyScopeRoutes } from '@/PropertyScope/routes';
import { tenantScopeRoutes } from '@/Tenant/routes';

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
    case 'Owner':
      return <Navigate to="/org/dashboard" replace />;
    
    case 'Manager':
    case 'Staff': {
      if (user.properties && user.properties.length === 1) {
        return <Navigate to={`/properties/${user.properties[0].id}/dashboard`} replace />;
      }
      if (user.org_id) {
         return <Navigate to="/select-property" replace />;
      }
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

        {/* 2. Organization Scope Layout */}
        <Route 
          path="/org"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Owner', 'Manager', 'Staff']}>
              <OrgScopeLayout><Outlet /></OrgScopeLayout>
            </ProtectedRoute>
          }
        >
          {orgScopeRoutes.map((route, idx) => {
            const children = route.children?.map((child, cIdx) => (
              child.index ? 
                <Route key={cIdx} index element={child.element} /> : 
                <Route key={cIdx} path={child.path} element={child.element} />
            ));

            return route.index ? (
              <Route key={idx} index element={route.element} />
            ) : (
              <Route key={idx} path={route.path} element={route.element}>{children}</Route>
            );
          })}
        </Route>

        {/* 3. Property Scope Layout */}
        <Route 
          path="/properties/:propertyId"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Owner', 'Manager', 'Staff']}>
              <PropertyScopeLayout><Outlet /></PropertyScopeLayout>
            </ProtectedRoute>
          }
        >
          {propertyScopeRoutes.map((route, idx) => {
            const children = route.children?.map((child, cIdx) => (
              child.index ? 
                <Route key={cIdx} index element={child.element} /> : 
                <Route key={cIdx} path={child.path} element={child.element} />
            ));

            return route.index ? (
              <Route key={idx} index element={route.element} />
            ) : (
              <Route key={idx} path={route.path} element={route.element}>{children}</Route>
            );
          })}
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
          {tenantScopeRoutes.map((route, idx) => {
            const children = route.children?.map((child, cIdx) => (
              child.index ? 
                <Route key={cIdx} index element={child.element} /> : 
                <Route key={cIdx} path={child.path} element={child.element} />
            ));

            return route.index ? (
              <Route key={idx} index element={route.element} />
            ) : (
              <Route key={idx} path={route.path} element={route.element}>{children}</Route>
            );
          })}
        </Route>

        {/* Special case: VNPAY return needs to be outside /app but within TenantLayout in index.tsx logic */}
        <Route
          path="/payment/vnpay/return"
          element={
            <ProtectedRoute allowedRoles={['Tenant']}>
              <TenantLayout>
                <Outlet />
              </TenantLayout>
            </ProtectedRoute>
          }
        >
           {/* Fallback to Tenant scope routes or direct mapping */}
           <Route index element={<Navigate to="/app/billing/vnpay-return" replace />} />
        </Route>

        {/* --- Fallback Route --- */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  );
}
