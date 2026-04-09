export interface LoginPayload {
  email: string;
  password?: string;
  phone?: string;
}

/** Assigned property entry returned by /auth/me for Manager/Staff scope */
export interface UserProperty {
  id: string;
  name: string;
}

export interface AuthResponse {
  two_factor?: boolean;
  method?: string;
  token?: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    /** Single role string — used for routing decisions */
    role: 'Admin' | 'Owner' | 'Manager' | 'Staff' | 'Tenant';
    /** Array alias kept for backwards compat */
    roles: string[];
    /** org_id returned at login (null for Admin) */
    org_id: string | null;
    permissions?: string[];
    avatar_url?: string;
  };
}

/** Full user object returned by /auth/me — includes properties[] for Manager/Staff */
export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'Admin' | 'Owner' | 'Manager' | 'Staff' | 'Tenant';
  roles?: string[];
  org_id: string | null;
  /** Assigned properties for Manager/Staff. Empty for Admin/Owner/Tenant. */
  properties: UserProperty[];
  permissions?: string[];
  avatar_url?: string;
  is_active?: boolean;
  created_at: string;
}

export type User = AuthUser;

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  otpCooldown: number;
  setAuth: (user: AuthUser, token: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  startOtpCooldown: (seconds: number) => void;
  decrementCooldown: () => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

export type LoginStep = 'LOGIN' | 'OTP';
