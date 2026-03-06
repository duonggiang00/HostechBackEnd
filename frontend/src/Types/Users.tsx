type UserRole = "ADMIN" | "OWNER" | "MANAGER" | "STAFF" | "TENANT";

export interface User {
  id: string;
  org_id: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  email?: string;
}
