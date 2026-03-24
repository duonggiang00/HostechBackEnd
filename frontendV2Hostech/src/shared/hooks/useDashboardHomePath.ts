import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

/**
 * Returns the correct "home" dashboard path for the currently logged-in user,
 * based on their role and selected scope (propertyId).
 *
 * - Admin   → /system/dashboard
 * - Owner/Manager → /org/dashboard
 * - Staff with propertyId → /properties/:id/dashboard
 * - Staff without propertyId → /org/properties
 * - Tenant  → /app/dashboard
 */
export function useDashboardHomePath(propertyId?: string): string {
  const { user } = useAuthStore();

  switch (user?.role) {
    case 'Admin':
      return '/system/dashboard';
    case 'Owner':
      return '/org/dashboard';
    case 'Manager':
      return propertyId
        ? `/properties/${propertyId}/dashboard`
        : '/org/properties';
    case 'Staff':
      return propertyId
        ? `/properties/${propertyId}/dashboard`
        : '/org/properties';
    case 'Tenant':
      return '/app/dashboard';
    default:
      return '/';
  }
}
