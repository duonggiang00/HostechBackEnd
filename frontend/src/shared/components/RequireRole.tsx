import React from "react";
import { Navigate } from "react-router";
import { useTokenStore } from "../../features/auth/stores/authStore";

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

/**
 * RequireRole Component
 * 
 * Bọc các route hoặc component yêu cầu quyền truy cập cụ thể.
 * Nếu không đủ quyền, sẽ redirect về trang chỉ định (mặc định là /).
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo = "/" 
}) => {
  const role = useTokenStore((state) => state.role);

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
