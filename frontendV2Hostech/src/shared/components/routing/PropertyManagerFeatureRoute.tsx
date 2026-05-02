import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

/** Mặc định: Admin / Owner / Manager (theo PROPERTY_NAVIGATION). */
const DEFAULT_PROPERTY_MANAGER_ROLES = ['Admin', 'Owner', 'Manager'];

type PropertyManagerFeatureRouteProps = {
  children: ReactNode;
  /** Role bổ sung được phép (vd. Staff — xét duyệt thanh toán). */
  extraRoles?: string[];
};

export function PropertyManagerFeatureRoute({ children, extraRoles = [] }: PropertyManagerFeatureRouteProps) {
  const hasRole = useAuthStore((s) => s.hasRole);
  const { propertyId } = useParams<{ propertyId: string }>();
  const pid = propertyId ?? '';
  const allowed = [...DEFAULT_PROPERTY_MANAGER_ROLES, ...extraRoles];

  if (!hasRole(allowed)) {
    return <Navigate to={`/properties/${pid}/dashboard`} replace />;
  }

  return <>{children}</>;
}
