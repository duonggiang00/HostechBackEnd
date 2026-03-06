import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useTokenStore } from '../stores/authStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const token = useTokenStore(state => state.getToken());
  const role = useTokenStore(state => state.role);
  const location = useLocation();

  if (!token) {
    // Chưa đăng nhập -> redirect về login, lưu lại trang đang cố vào
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
     if (!role || !allowedRoles.includes(role)) {
       // Đăng nhập rồi nhưng không đủ quyền
       // Nếu là Tenant thì về /me, ngược lại về /manage
       const homePath = role?.toLowerCase() === "tenant" ? "/me" : "/manage";

       return <Navigate to={homePath} replace />;
     }
  }

  // Hợp lệ -> render children nếu có, không thì render Outlet cho nested routes
  return children ? <>{children}</> : <Outlet />;
};
