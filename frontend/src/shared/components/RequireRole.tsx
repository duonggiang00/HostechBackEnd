import React from "react";
import { Navigate } from "react-router";
import { useTokenStore } from "../../features/auth/stores/authStore";

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
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
  redirectTo,
  fallback = null
}) => {
  const roles = useTokenStore((state) => state.roles);

  // Check if user has ANY of the allowed roles
  const hasAccess = roles?.some(userRole => allowedRoles.includes(userRole));

  if (!hasAccess) {
    if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
