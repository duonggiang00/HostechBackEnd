import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

const ORG_GOVERNANCE_ROLES = ['Admin', 'Owner'];

export function OwnerOrgGovernanceRoute({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();

  if (!user?.role || !ORG_GOVERNANCE_ROLES.includes(user.role)) {
    return <Navigate to="/org/dashboard" replace />;
  }

  return <>{children}</>;
}
