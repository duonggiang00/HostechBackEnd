import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { useScopeStore } from '@/shared/stores/useScopeStore';

/**
 * Returns the correct "home" dashboard path for the currently logged-in user,
 * based on their role and selected scope (propertyId).
 *
 * - Admin   → /admin/dashboard
 * - Owner   → /admin/properties
 * - Manager/Staff with propertyId → /admin/properties/:id/dashboard
 * - Manager/Staff without propertyId → /admin/select-property (PropertyScopeLayout page)
 * - Tenant  → /app/dashboard
 */
export function useDashboardHomePath(): string {
  const { user } = useAuthStore();
  const { propertyId } = useScopeStore();

  switch (user?.role) {
    case 'Admin':
      return '/admin/dashboard';
    case 'Owner':
      return '/admin/properties';
    case 'Manager':
    case 'Staff':
      return propertyId
        ? `/admin/properties/${propertyId}/dashboard`
        : '/admin/select-property';
    case 'Tenant':
      return '/app/dashboard';
    default:
      return '/admin';
  }
}
