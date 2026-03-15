import { create } from "zustand";
import type { ITokenStore } from "../../../shared/types/store";

export const useTokenStore = create<ITokenStore>((set, get) => ({
  token: "",
  roles: [],
  role: null,
  permissions: [],
  org_id: null,
  isLoading: true,

  setToken: (token: string, roles: string[], permissions: string[], org_id: string | null) => {
    localStorage.setItem("token", token);
    localStorage.setItem("roles", JSON.stringify(roles));
    localStorage.setItem("permissions", JSON.stringify(permissions));
    if (org_id) localStorage.setItem("org_id", org_id);
    else localStorage.removeItem("org_id");

    set({
      token,
      roles,
      role: roles[0] || null,
      permissions,
      org_id,
      isLoading: false,
    });
  },

  restoreToken: () => {
    const token = localStorage.getItem("token");
    const rolesStr = localStorage.getItem("roles");
    const permissionsStr = localStorage.getItem("permissions");
    const org_id = localStorage.getItem("org_id");

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
        role: roles[0] || null,
        permissions,
        org_id,
        isLoading: false,
      });
      return;
    }

    set({ token: "", roles: [], permissions: [], org_id: null, isLoading: false });
  },

  getRoles: () => {
    return get().roles;
  },

  getToken: () => {
    return get().token;
  },

  getOrgId: () => {
    return get().org_id;
  },

  clearToken: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    localStorage.removeItem("permissions");
    localStorage.removeItem("org_id");
    set({ token: "", roles: [], role: null, permissions: [], org_id: null });
  },
}));
