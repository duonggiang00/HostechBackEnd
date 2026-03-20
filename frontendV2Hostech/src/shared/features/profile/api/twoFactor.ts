import apiClient from '@/shared/api/client';
import type { MfaSetupResponse, MfaInitializeResponse, MfaEnablePayload } from '../types';

export const twoFactorApi = {
  /**
   * GET /api/user/mfa/setup — Lấy trạng thái MFA setup
   * Returns: { mfa_enabled, mfa_method, has_totp_secret }
   */
  getSetup: async (): Promise<MfaSetupResponse> => {
    const response = await apiClient.get<MfaSetupResponse>('/user/mfa/setup');
    return response.data;
  },

  /**
   * POST /api/user/mfa/initialize — Khởi tạo MFA (tạo secret + QR)
   * Body: { method: 'totp' | 'email' }
   * Returns: { secret_key, qr_code_svg } (TOTP) hoặc { message } (email)
   */
  initialize: async (method: 'totp' | 'email' = 'totp'): Promise<MfaInitializeResponse> => {
    const response = await apiClient.post<MfaInitializeResponse>('/user/mfa/initialize', { method });
    return response.data;
  },

  /**
   * POST /api/user/mfa/enable — Kích hoạt MFA bằng code + password
   * Body: { method, code, password }
   */
  enable: async (payload: MfaEnablePayload): Promise<{ message: string; method: string }> => {
    const response = await apiClient.post<{ message: string; method: string }>('/user/mfa/enable', payload);
    return response.data;
  },

  /**
   * DELETE /api/user/mfa/disable — Tắt MFA (cần password)
   * Body: { password }
   */
  disable: async (password: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>('/user/mfa/disable', {
      data: { password },
    });
    return response.data;
  },
};
