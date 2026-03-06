import Api from "./Api";
import type { IMe } from "../Types/Auth.Type";

// Lấy thông tin hồ sơ người dùng hiện tại
export const getProfile = async (): Promise<IMe> => {
    const res = await Api.get("profile");
    return res.data?.data ?? res.data;
};

// Cập nhật thông tin hồ sơ
export const updateProfile = async (data: Partial<IMe & { full_name: string }>): Promise<IMe> => {
    const res = await Api.put("profile", data);
    return res.data?.data ?? res.data;
};

// Đổi mật khẩu
export const changePassword = async (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
}): Promise<void> => {
    await Api.post("profile/change-password", data);
};

// Upload avatar
export const uploadAvatar = async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await Api.post("profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
};

// Lấy trạng thái MFA
export const getMfaStatus = async (): Promise<{ enabled: boolean }> => {
    const res = await Api.get("profile/mfa-status");
    return res.data?.data ?? res.data;
};
