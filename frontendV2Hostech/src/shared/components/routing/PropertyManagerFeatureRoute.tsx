import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

/** Matches PROPERTY_NAVIGATION items marked Owner/Manager (plus Admin). */
const PROPERTY_MANAGER_ROLES = ['Admin', 'Owner', 'Manager'];

export function PropertyManagerFeatureRoute({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const { propertyId } = useParams<{ propertyId: string }>();
  const pid = propertyId ?? '';

  if (!user?.role || !PROPERTY_MANAGER_ROLES.includes(user.role)) {
    return <Navigate to={`/properties/${pid}/dashboard`} replace />;
  }

  return <>{children}</>;
}
