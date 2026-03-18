import axiosClient from "../../../shared/api/axiosClient";

// Register
export const register = async () => {
  const { data } = await axiosClient.post("auth/register");
  return data;
};

// Login
export const login = async (data: any) => {
  return await axiosClient.post("auth/login", {
    ...data,
    device_name: "web",
    device_platform: "Web",
  });
};

// Two Factor Challenge
export const twoFactorChallenge = async (data: { code?: string; recovery_code?: string }) => {
  return await axiosClient.post("auth/two-factor-challenge", data);
};

// Lấy thông tin người dùng hiện tại
export const getMe = async () => {
  const { data } = await axiosClient.get<any>("auth/me");
  return data;
};

// Đăng xuất — revoke token trên server
export const logout = async (): Promise<void> => {
  await axiosClient.post("auth/logout");
};
