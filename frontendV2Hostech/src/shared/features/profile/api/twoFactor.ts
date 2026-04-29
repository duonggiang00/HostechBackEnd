import apiClient from '@/shared/api/client';
import type { MfaSetupResponse, MfaInitializeResponse, MfaEnablePayload, MfaDisablePayload } from '../types';

export const twoFactorApi = {
  /**
   * GET /api/user/mfa/setup — Lấy trạng thái MFA
   * Returns: { enabled_methods, mfa_enabled, has_totp, has_email, has_totp_secret }
   */
  getSetup: async (): Promise<MfaSetupResponse> => {
    const response = await apiClient.get<MfaSetupResponse>('/user/mfa/setup');
    return response.data;
  },

  /**
   * POST /api/user/mfa/initialize — Khởi tạo MFA (tạo secret + QR / gửi OTP)
   * Body: { method: 'totp' | 'email' }
   */
  initialize: async (method: 'totp' | 'email' = 'totp'): Promise<MfaInitializeResponse> => {
    const response = await apiClient.post<MfaInitializeResponse>('/user/mfa/initialize', { method });
    return response.data;
  },

  /**
   * POST /api/user/mfa/enable — Kích hoạt thêm một phương thức MFA
   * Body: { method, code, password }
   * Returns: { message, enabled_methods }
   */
  enable: async (payload: MfaEnablePayload): Promise<{ message: string; enabled_methods: string[] }> => {
    const response = await apiClient.post<{ message: string; enabled_methods: string[] }>('/user/mfa/enable', payload);
    return response.data;
  },

  /**
   * DELETE /api/user/mfa/disable — Tắt một phương thức MFA (hoặc tắt toàn bộ nếu không truyền method)
   * Body: { password, method? }
   * Returns: { message, enabled_methods }
   */
  disable: async (payload: MfaDisablePayload): Promise<{ message: string; enabled_methods: string[] }> => {
    const response = await apiClient.delete<{ message: string; enabled_methods: string[] }>('/user/mfa/disable', {
      data: payload,
    });
    return response.data;
  },
};
