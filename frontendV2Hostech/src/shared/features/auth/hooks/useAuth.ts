import { useAuthStore } from '../stores/useAuthStore';

/**
 * A hook that provides authentication state and helpers.
 * This is a wrapper around useAuthStore for cleaner consumption.
 */
export function useAuth() {
  const store = useAuthStore();
  
  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.setAuth,
    logout: store.logout,
    updateUser: store.updateUser,
    hasPermission: store.hasPermission,
    hasRole: store.hasRole,
  };
}
