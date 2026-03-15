import axiosClient from "../../../shared/api/axiosClient";
import type { ProfileType, PasswordDataType } from "../types";

// Lấy thông tin hồ sơ người dùng hiện tại
export const getProfile = async (): Promise<ProfileType> => {
  const res = await axiosClient.get("profile");
  return res.data?.data ?? res.data;
};

// Cập nhật thông tin hồ sơ
export const updateProfile = async (
  data: Partial<ProfileType>,
): Promise<ProfileType> => {
  const res = await axiosClient.put("profile", data);
  return res.data?.data ?? res.data;
};

// Đổi mật khẩu
export const changePassword = async (data: PasswordDataType): Promise<void> => {
  await axiosClient.post("user/password", data);
  await axiosClient.post("profile/change-password", data);
};

// Upload avatar
export const uploadAvatar = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await axiosClient.post("profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data ?? res.data;
};

// ─── Fortify 2FA ───

export const getTwoFactorQrCode = async (): Promise<{ svg: string }> => {
  const res = await axiosClient.get("user/two-factor-qr-code");
  return res.data;
};

export const enableTwoFactor = async (): Promise<void> => {
  await axiosClient.post("user/two-factor-authentication");
};

export const disableTwoFactor = async (): Promise<void> => {
  await axiosClient.delete("user/two-factor-authentication");
};

export const confirmTwoFactor = async (code: string): Promise<void> => {
  await axiosClient.post("user/confirmed-two-factor-authentication", { code });
};

export const getTwoFactorRecoveryCodes = async (): Promise<string[]> => {
  const res = await axiosClient.get("user/two-factor-recovery-codes");
  return res.data;
};

export const regenerateRecoveryCodes = async (): Promise<void> => {
  await axiosClient.post("user/two-factor-recovery-codes");
};
