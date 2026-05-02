import { Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

export default function PropertyScopeIndexRedirect() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const hasRole = useAuthStore((s) => s.hasRole);

  if (!propertyId) {
    return <Navigate to="/org/properties" replace />;
  }

  if (hasRole(['Staff'])) {
    return <Navigate to={`/properties/${propertyId}/staff-home`} replace />;
  }

  return <Navigate to={`/properties/${propertyId}/dashboard`} replace />;
}
