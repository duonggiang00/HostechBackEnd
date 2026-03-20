import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { profileApi } from '../api/profile';
import { twoFactorApi } from '../api/twoFactor';
import type { MfaEnablePayload } from '../types';

const MFA_STATUS_KEY = ['mfa-status'] as const;
const MFA_SETUP_KEY = ['mfa-setup'] as const;

/** Fetch MFA status from profile controller (GET /api/profile/mfa-status) */
export const useMfaStatus = () => {
  return useQuery({
    queryKey: MFA_STATUS_KEY,
    queryFn: profileApi.getMfaStatus,
    staleTime: 5 * 60 * 1000,
  });
};

/** Fetch MFA setup info (GET /api/user/mfa/setup) */
export const useMfaSetup = () => {
  return useQuery({
    queryKey: MFA_SETUP_KEY,
    queryFn: twoFactorApi.getSetup,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Initialize MFA — generates TOTP secret + QR code
 * POST /api/user/mfa/initialize { method: 'totp' }
 */
export const useInitializeMfa = () => {
  return useMutation({
    mutationFn: (method: 'totp' | 'email' = 'totp') => twoFactorApi.initialize(method),
    onError: () => {
      toast.error('Không thể khởi tạo xác thực 2 lớp.');
    },
  });
};

/**
 * Enable MFA — confirms TOTP code + password
 * POST /api/user/mfa/enable { method, code, password }
 */
export const useEnableMfa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MfaEnablePayload) => twoFactorApi.enable(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MFA_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: MFA_SETUP_KEY });
      toast.success(data.message || 'Đã kích hoạt xác thực 2 lớp.');
    },
    onError: () => {
      toast.error('Mã xác thực hoặc mật khẩu không đúng.');
    },
  });
};

/**
 * Disable MFA — requires password confirmation
 * DELETE /api/user/mfa/disable { password }
 */
export const useDisableMfa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password: string) => twoFactorApi.disable(password),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MFA_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: MFA_SETUP_KEY });
      toast.success(data.message || 'Đã tắt xác thực 2 lớp.');
    },
    onError: () => {
      toast.error('Không thể tắt 2FA. Mật khẩu không đúng.');
    },
  });
};
