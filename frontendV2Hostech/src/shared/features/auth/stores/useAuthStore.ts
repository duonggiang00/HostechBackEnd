import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      otpCooldown: 0,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true, isLoading: false, error: null }),
      updateUser: (user) => set((state) => ({ 
        user: state.user ? { ...state.user, ...user } : null 
      })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      startOtpCooldown: (seconds) => set({ otpCooldown: seconds }),
      decrementCooldown: () => set((state) => ({ otpCooldown: Math.max(0, state.otpCooldown - 1) })),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        
        return user.permissions?.includes(permission) || false;
      },
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;

        const rolesToMatch = Array.isArray(role) ? role : [role];
        const userRoles =
          user.roles && user.roles.length > 0
            ? user.roles
            : user.role
              ? [user.role]
              : [];

        return rolesToMatch.some((r) => userRoles.includes(r));
      },
    }),
    {
      name: 'hostech-auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
