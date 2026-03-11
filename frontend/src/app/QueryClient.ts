import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient dùng chung toàn bộ app.
 * Cấu hình defaults:
 * - staleTime 30s: data không refetch ngay khi re-mount
 * - retry 1: chỉ retry 1 lần khi có lỗi (tránh retry 401)
 * - refetchOnWindowFocus false: không refetch khi focus window trong dev
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,        // 30 giây
      gcTime: 1000 * 60 * 5,       // 5 phút garbage collect
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
