import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../shared/constants/queryKeys";
import { getMe } from "../api/authApi";
import { useTokenStore } from "../stores/authStore";

/**
 * Hook lấy thông tin user hiện tại đang đăng nhập.
 * Chỉ gọi API khi có token.
 * Cache 5 phút — dùng thay thế useUserInfo hook cũ.
 */
export const useCurrentUser = () => {
  const token = useTokenStore((state) => state.getToken());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.currentUser,
    queryFn: getMe,
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 phút
    gcTime: 1000 * 60 * 10,   // 10 phút
  });

  return {
    user: data,
    isLoading,
    error,
    refetch,
  };
};
