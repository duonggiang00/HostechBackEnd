import { create } from "zustand";
import type { ITokenStore } from "../../../shared/types/store";

export const useTokenStore = create<ITokenStore>((set, get) => ({
  token: "",
  roles: [],
  permissions: [],
  isLoading: true,

  setToken: (token: string, roles: string[], permissions: string[]) => {
    localStorage.setItem("token", token);
    localStorage.setItem("roles", JSON.stringify(roles));
    localStorage.setItem("permissions", JSON.stringify(permissions));

    set({
      token,
      roles,
      permissions,
      isLoading: false,
    });
  },

  restoreToken: () => {
    const token = localStorage.getItem("token");
    const rolesStr = localStorage.getItem("roles");
    const permissionsStr = localStorage.getItem("permissions");

    if (token) {
      let roles = [];
      let permissions = [];
      try {
        roles = rolesStr ? JSON.parse(rolesStr) : [];
        permissions = permissionsStr ? JSON.parse(permissionsStr) : [];
      } catch (e) {}

      set({
        token,
        roles,
        permissions,
        isLoading: false,
      });
      return;
    }

    set({ token: "", roles: [], permissions: [], isLoading: false });
  },

  getRoles: () => {
    return get().roles;
  },

  getToken: () => {
    return get().token;
  },

  clearToken: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    localStorage.removeItem("permissions");
    set({ token: "", roles: [], permissions: [] });
  },
}));
