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

// Verify OTP
export const verifyOTP = async (data: any) => {
  return axiosClient.post("auth/otp/verify", data);
};

// Gửi lại mã OTP
export const resendOTP = (data: any) => {
  return axiosClient.post("auth/otp/request", { ...data });
};

// Register Users
export const registerUser = async (data: any) => {
  return axiosClient.post("auth/register-user", { ...data });
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
