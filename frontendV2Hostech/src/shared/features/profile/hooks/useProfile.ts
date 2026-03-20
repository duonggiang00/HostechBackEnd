import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { profileApi } from '../api/profile';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import type { ProfileUpdatePayload, PasswordChangePayload } from '../types';

const PROFILE_KEY = ['profile'] as const;

/** Fetch current user profile */
export const useProfile = () => {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/** Update profile information */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (data: ProfileUpdatePayload) => profileApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      // Sync partial data back to auth store
      updateUser({
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        phone: updatedUser.phone ?? undefined,
        avatar_url: updatedUser.avatar_url ?? undefined,
      });
      toast.success('Cập nhật thông tin thành công.');
    },
    onError: () => {
      toast.error('Cập nhật thông tin thất bại.');
    },
  });
};

/** Change password */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: PasswordChangePayload) => profileApi.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công.');
    },
    onError: () => {
      // Error toast handled by apiClient interceptor
    },
  });
};

/** Upload avatar */
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      updateUser({ avatar_url: res.avatar_url });
      toast.success('Cập nhật ảnh đại diện thành công.');
    },
    onError: () => {
      toast.error('Upload ảnh đại diện thất bại.');
    },
  });
};
