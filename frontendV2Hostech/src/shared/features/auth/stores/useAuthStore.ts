import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loginMode: 'password',
      isLoading: false,
      error: null,
      otpCooldown: 0,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true, isLoading: false, error: null }),
      updateUser: (user) => set((state) => ({ 
        user: state.user ? { ...state.user, ...user } : null 
      })),
      setLoginMode: (mode) => set({ loginMode: mode, error: null }),
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
        if (user.role === 'Admin') return true;
        
        return user.permissions?.includes(permission) || false;
      },
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'Admin') return true;
        
        const roles = Array.isArray(role) ? role : [role];
        if (!user.role) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: 'hostech-auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
