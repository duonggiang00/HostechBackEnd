import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string | string[];
  role?: string | string[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * A component that conditionally renders its children based on the user's permissions and roles.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  role,
  fallback = null,
  requireAll = false,
}) => {
  const { user, hasPermission, hasRole } = useAuth();

  if (!user) return <>{fallback}</>;

  let hasAccess = true;

  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    if (requireAll) {
      hasAccess = permissions.every(p => hasPermission(p));
    } else {
      hasAccess = permissions.some(p => hasPermission(p));
    }
  }

  if (hasAccess && role) {
    const roles = Array.isArray(role) ? role : [role];
    if (requireAll) {
      hasAccess = roles.every(r => hasRole(r));
    } else {
      hasAccess = roles.some(r => hasRole(r));
    }
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
