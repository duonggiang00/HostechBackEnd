import { create } from "zustand";
import type { ITokenStore } from "../../../shared/types/store";

export const useTokenStore = create<ITokenStore>((set, get) => ({
  token: "",
  role: null,
  isLoading: true,

  setToken: (token: string, role?: string) => {
    localStorage.setItem("token", token);
    if (role) localStorage.setItem("role", role);

    set({
      token,
      role: role ?? null,
      isLoading: false,
    });
  },

  restoreToken: () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      set({
        token,
        role: role ?? null,
        isLoading: false,
      });
      return;
    }

    set({ token: "", role: null, isLoading: false });
  },

  getRole: () => {
    return get().role;
  },

  getToken: () => {
    return get().token;
  },

  clearToken: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    set({ token: "", role: null });
  },
}));
