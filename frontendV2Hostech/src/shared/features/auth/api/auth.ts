import apiClient from '@/shared/api/client';
import type { LoginPayload, AuthResponse, AuthUser } from '../types';

export const authApi = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', {
      ...data,
      device_name: 'web',
      device_platform: 'Web',
    });
    return response.data;
  },

  loginChallenge: async (data: { code: string; recovery_code?: string }) => {
    const response = await apiClient.post('/auth/two-factor-challenge', data);
    return response.data;
  },

  resendOTP: async (data: { email?: string; phone?: string }) => {
    // Note: Standard Fortify doesn't have a direct "resend" endpoint for login MFA.
    // However, if the project has a custom one, we use it. 
    // For now, mirroring the existing interface but pointing to a placeholder or 
    // documenting that it might need a custom backend route.
    const response = await apiClient.post('/auth/otp/request', data);
    return response.data;
  },

  registerUser: async (data: any) => {
    const response = await apiClient.post('/auth/register-user', data);
    return response.data;
  },

  /**
   * Register a new user from an invitation link (both system invitations and contract invitations).
   * Calls Fortify POST /auth/register → CreateNewUser action.
   *
   * This is the ONLY correct path for invitation-based registration because CreateNewUser
   * performs the critical step of backfilling ContractMember.user_id for contract tenants
   * (PENDING_INVITE → PENDING), which /system/invitations/accept does NOT do.
   */
  registerFromInvitation: async (data: {
    invite_token: string;
    email: string;
    full_name: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    org_name?: string;
    identity_number?: string;
    identity_issued_date?: string;
    identity_issued_place?: string;
    date_of_birth?: string;
    address?: string;
    license_plate?: string;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  /** GET /auth/me — Returns full user object with properties[] for Manager/Staff */
  getMe: async (): Promise<AuthUser> => {
    const response = await apiClient.get('/auth/me');
    // UserResource wraps in { data: ... } via Laravel's resource
    return response.data?.data ?? response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
