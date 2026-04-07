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
/**
 * Returns the correct "home" dashboard path for the currently logged-in user,
 * based on their role and selected scope (propertyId).
 */
export function useDashboardHomePath(propertyId?: string): string {
  const { user } = useAuthStore();

  switch (user?.role) {
    case 'Owner':
      return '/org/dashboard';
    case 'Manager':
      return propertyId
        ? `/properties/${propertyId}/dashboard`
        : '/select-property';
    case 'Staff':
      return propertyId
        ? `/properties/${propertyId}/dashboard`
        : '/select-property';
    case 'Tenant':
      return '/app/dashboard';
    default:
      return '/';
  }
}

/**
 * Returns the correct path to "exit" the current building/property context
 * and return to a higher-level selection menu or dashboard.
 */
export function useScopeExitPath(): string {
  const { user } = useAuthStore();

  switch (user?.role) {
    case 'Owner':
      return '/org/dashboard';
    case 'Manager':
    case 'Staff':
      return '/select-property';
    default:
      return '/';
  }
}
