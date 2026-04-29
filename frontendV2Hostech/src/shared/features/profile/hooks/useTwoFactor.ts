import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { twoFactorApi } from '../api/twoFactor';
import type { MfaEnablePayload, MfaDisablePayload } from '../types';

const MFA_SETUP_KEY = ['mfa-setup'] as const;

/** Fetch full MFA setup state (enabled_methods, per-method flags) */
export const useMfaSetup = () => {
  return useQuery({
    queryKey: MFA_SETUP_KEY,
    queryFn: twoFactorApi.getSetup,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Initialize MFA for a given method.
 * TOTP: returns { secret_key, qr_code_svg }
 * Email: sends OTP, returns { message }
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
 * Enable (add) a new MFA method after verifying code + password.
 */
export const useEnableMfa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MfaEnablePayload) => twoFactorApi.enable(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MFA_SETUP_KEY });
      toast.success(data.message || 'Đã kích hoạt xác thực 2 lớp.');
    },
    onError: () => {
      toast.error('Mã xác thực hoặc mật khẩu không đúng.');
    },
  });
};

/**
 * Disable a specific MFA method (or all if method is omitted).
 */
export const useDisableMfa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MfaDisablePayload) => twoFactorApi.disable(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MFA_SETUP_KEY });
      toast.success(data.message || 'Đã tắt xác thực 2 lớp.');
    },
    onError: () => {
      toast.error('Không thể tắt 2FA. Mật khẩu không đúng.');
    },
  });
};
