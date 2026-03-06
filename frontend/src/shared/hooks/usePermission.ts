import { useTokenStore } from "../../features/auth/stores/authStore";

/**
 * usePermission Hook
 * 
 * Cung cấp logic kiểm tra quyền hạn (RBAC) đồng bộ với Backend Policy.
 * Dùng để ẩn/hiện UI elements hoặc chặn truy cập logic.
 */
export const usePermission = () => {
  const rawRole = useTokenStore((state) => state.role);
  const role = rawRole?.toLowerCase();

  /**
   * can(action, resource)
   */
  const can = (action: string, resource: string): boolean => {
    if (!role) return false;

    // Super Admin / Owner has all permissions
    if (role === "admin" || role === "owner") return true;

    // Manager permissions
    if (role === "manager") {
      const managerRules: Record<string, string[]> = {
        properties: ["read", "update"],
        floors: ["read", "create", "update", "delete"],
        rooms: ["read", "create", "update", "delete"],
        contracts: ["read", "create", "update"],
      };
      return managerRules[resource]?.includes(action) ?? false;
    }

    // Staff permissions
    if (role === "staff") {
      const staffRules: Record<string, string[]> = {
        properties: ["read"],
        floors: ["read"],
        rooms: ["read", "update"], // Staff can update room status
        contracts: ["read"],
      };
      return staffRules[resource]?.includes(action) ?? false;
    }

    // Tenant permissions
    if (role === "tenant") {
      const tenantRules: Record<string, string[]> = {
        rooms: ["read"],
        contracts: ["read"],
      };
      return tenantRules[resource]?.includes(action) ?? false;
    }

    return false;
  };

  return { can, role };
};
