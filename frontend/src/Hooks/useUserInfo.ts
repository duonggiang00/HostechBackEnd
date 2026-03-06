import { useQuery } from "@tanstack/react-query";
import { getMe } from "../features/auth/api/authApi";
import { useTokenStore } from "../features/auth/stores/authStore";

export const useUserInfo = () => {
  const token = useTokenStore((state) => state.getToken());

  const { data, isLoading, error } = useQuery({
    queryKey: ["userInfo", token],
    queryFn: getMe,
    enabled: !!token, // Chỉ gọi khi có token
    staleTime: 1000 * 60 * 5, // Cache 5 phút
  });

  return {
    user: data,
    isLoading,
    error,
  };
};
