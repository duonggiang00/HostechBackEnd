import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { profileApi } from '../api/profile';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import type { ProfileUpdatePayload, PasswordChangePayload } from '../types';
import type { AuthUser } from '@/shared/features/auth/types';

/** Shared React Query key for GET /api/profile (session bootstrap + profile page). */
export const PROFILE_QUERY_KEY = ['profile'] as const;

/** Fetch current user profile and sync RBAC fields into the auth store. */
export const useProfile = () => {
  const updateUser = useAuthStore((s) => s.updateUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const data = query.data;
    if (!data) {
      return;
    }
    updateUser({
      permissions: data.permissions,
      roles: data.roles,
      role: data.role as AuthUser['role'],
      org_id: data.org_id ?? null,
      properties: data.properties ?? [],
      profile_loaded: true,
    });
  }, [query.data, updateUser]);

  return query;
};

/** Update profile information */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (data: ProfileUpdatePayload) => profileApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      updateUser({ avatar_url: res.avatar_url });
      toast.success('Cập nhật ảnh đại diện thành công.');
    },
    onError: () => {
      toast.error('Upload ảnh đại diện thất bại.');
    },
  });
};
