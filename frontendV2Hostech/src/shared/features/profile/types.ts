/** Profile user — maps to backend UserResource */
export interface ProfileUser {
  id: string;
  org_id: string | null;
  role: string;

  // Contact
  full_name: string;
  email: string;
  phone: string | null;

  // Identity
  identity_number: string | null;
  identity_issued_date: string | null;
  identity_issued_place: string | null;
  date_of_birth: string | null;
  address: string | null;

  // Avatar
  avatar_url: string | null;

  // Account status
  is_active: boolean;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  last_login_at: string | null;

  // MFA
  mfa_enabled: boolean;
  mfa_method: string | null;
  two_factor_enabled: boolean;

  // RBAC
  roles: string[];
  permissions: string[];
  properties: { id: string; name: string }[];

  created_at: string;
  updated_at: string;
}

/** Payload for PUT /api/profile */
export interface ProfileUpdatePayload {
  full_name: string;
  email: string;
  phone?: string | null;
  identity_number?: string | null;
  identity_issued_date?: string | null;
  identity_issued_place?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
}

/** Payload for POST /api/profile/change-password */
export interface PasswordChangePayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

/** Response from GET /api/profile/mfa-status */
export interface MfaStatus {
  mfa_enabled: boolean;
  mfa_method: string | null;
  mfa_enrolled_at: string | null;
  two_factor_enabled: boolean;
  two_factor_confirmed_at: string | null;
}

/** Response from GET /api/user/mfa/setup */
export interface MfaSetupResponse {
  mfa_enabled: boolean;
  mfa_method: string;
  has_totp_secret: boolean;
}

/** Response from POST /api/user/mfa/initialize (TOTP) */
export interface MfaInitializeResponse {
  secret_key?: string;
  qr_code_svg?: string;
  message?: string;
}

/** Payload for POST /api/user/mfa/enable */
export interface MfaEnablePayload {
  method: 'totp' | 'email';
  code: string;
  password: string;
}

/** Avatar upload response */
export interface AvatarUploadResponse {
  message: string;
  avatar_url: string;
}
