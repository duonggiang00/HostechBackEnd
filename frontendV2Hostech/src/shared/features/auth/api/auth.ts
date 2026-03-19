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

  verifyOTP: async (data: { email?: string; phone?: string; otp: string }) => {
    const response = await apiClient.post('/auth/otp/verify', data);
    return response.data;
  },

  resendOTP: async (data: { email?: string; phone?: string }) => {
    const response = await apiClient.post('/auth/otp/request', data);
    return response.data;
  },

  registerUser: async (data: any) => {
    const response = await apiClient.post('/auth/register-user', data);
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
