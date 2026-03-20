import apiClient from '@/shared/api/client';
import type {
  ProfileUser,
  ProfileUpdatePayload,
  PasswordChangePayload,
  MfaStatus,
  AvatarUploadResponse,
} from '../types';

export const profileApi = {
  /** GET /api/profile — Lấy thông tin profile */
  getProfile: async (): Promise<ProfileUser> => {
    const response = await apiClient.get<{ data: ProfileUser }>('/profile');
    return response.data.data;
  },

  /** PUT /api/profile — Cập nhật thông tin cá nhân */
  updateProfile: async (data: ProfileUpdatePayload): Promise<ProfileUser> => {
    const response = await apiClient.put<{ data: ProfileUser }>('/profile', data);
    return response.data.data;
  },

  /** POST /api/profile/change-password — Đổi mật khẩu */
  changePassword: async (data: PasswordChangePayload): Promise<{ message: string }> => {
    const response = await apiClient.post('/profile/change-password', data);
    return response.data;
  },

  /** POST /api/profile/avatar — Upload ảnh đại diện (multipart) */
  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post<AvatarUploadResponse>('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** GET /api/profile/mfa-status — Trạng thái MFA */
  getMfaStatus: async (): Promise<MfaStatus> => {
    const response = await apiClient.get<MfaStatus>('/profile/mfa-status');
    return response.data;
  },
};
