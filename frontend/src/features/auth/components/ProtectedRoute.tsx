import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useTokenStore } from '../stores/authStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const token = useTokenStore(state => state.getToken());
  const roles = useTokenStore(state => state.roles);
  const location = useLocation();

  if (!token) {
    // Chưa đăng nhập -> redirect về login, lưu lại trang đang cố vào
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
     if (!roles || !roles.some(r => allowedRoles.includes(r))) {
       // Đăng nhập rồi nhưng không đủ quyền
       // Nếu là Tenant thì về /manage/rooms, ngược lại về /manage
       const homePath = roles?.some(r => r.toLowerCase() === "tenant") ? "/manage/rooms" : "/manage";

       return <Navigate to={homePath} replace />;
     }
  }

  // Hợp lệ -> render children nếu có, không thì render Outlet cho nested routes
  return children ? <>{children}</> : <Outlet />;
};
