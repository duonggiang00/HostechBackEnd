import axios from "axios";
import { useTokenStore } from "../features/auth/stores/authStore";

const Api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000"}/api/`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: đính kèm Bearer token vào mọi request
Api.interceptors.request.use((config) => {
  const token = useTokenStore.getState().getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: xử lý lỗi toàn cục
Api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token hết hạn hoặc không hợp lệ → xóa token và redirect về login
      useTokenStore.getState().clearToken();
      window.location.href = "/auth";
    }

    // Trả error gốc để từng component/query tự xử lý (422, 403, 404, 500, ...)
    return Promise.reject(error);
  }
);

export default Api;
