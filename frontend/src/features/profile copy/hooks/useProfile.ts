import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProfile, updateProfile, uploadAvatar, changePassword,
  getTwoFactorQrCode, enableTwoFactor, disableTwoFactor, 
  confirmTwoFactor, getTwoFactorRecoveryCodes, regenerateRecoveryCodes 
} from '../api/profileApi';
import type { ProfileType, PasswordDataType } from '../types';
import { message } from 'antd';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ProfileType>) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      message.success('Cập nhật hồ sơ thành công!');
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi cập nhật hồ sơ!');
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      message.success('Cập nhật ảnh đại diện thành công!');
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi tải ảnh lên!');
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: PasswordDataType) => changePassword(data),
    onSuccess: () => {
      message.success('Đổi mật khẩu thành công!');
    },
    onError: (err: any) => {
      if (err?.response?.status === 422) {
         message.error('Mật khẩu cũ không chính xác hoặc dữ liệu không hợp lệ!');
      } else {
         message.error('Có lỗi xảy ra khi đổi mật khẩu!');
      }
    },
  });
};

// --- Fortify 2FA Hooks ---

export const useTwoFactorQrCode = (enabled: boolean) => {
  return useQuery({
    queryKey: ['two-factor-qr'],
    queryFn: getTwoFactorQrCode,
    enabled, // Chỉ fetch khi có cờ bật 2FA
    retry: false
  });
};

export const useTwoFactorRecoveryCodes = (enabled: boolean) => {
  return useQuery({
    queryKey: ['two-factor-recovery'],
    queryFn: getTwoFactorRecoveryCodes,
    enabled,
    retry: false
  });
};

export const useEnableTwoFactor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enableTwoFactor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['two-factor-qr'] });
    },
  });
};

export const useConfirmTwoFactor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => confirmTwoFactor(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['two-factor-recovery'] });
      message.success('Kích hoạt 2FA thành công!');
    },
    onError: () => {
      message.error('Mã xác thực không hợp lệ!');
    }
  });
};

export const useDisableTwoFactor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disableTwoFactor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.setQueryData(['two-factor-qr'], null);
      queryClient.setQueryData(['two-factor-recovery'], null);
      message.success('Đã tắt 2FA!');
    }
  });
};

export const useRegenerateRecoveryCodes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: regenerateRecoveryCodes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['two-factor-recovery'] });
      message.success('Đã tạo lại mã khôi phục!');
    }
  });
};
