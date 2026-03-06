import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { QUERY_KEYS } from "../../../shared/constants/queryKeys";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
  forceDeleteUser,
} from "../api/userApi";
import type { PaginationParams } from "../../../shared/types/Shared";

// ───── Queries ─────

export const useUsers = (params?: PaginationParams) =>
  useQuery({
    queryKey: QUERY_KEYS.users.list(params),
    queryFn: () => getUsers(params),
  });

export const useUser = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.users.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
  });

// ───── Mutations ─────

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      notification.success({ message: "Tạo người dùng thành công" });
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message ?? "Không thể tạo người dùng",
      });
    },
  });
};

export const useUpdateUser = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users.detail(id) });
      notification.success({ message: "Cập nhật người dùng thành công" });
    },
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      notification.success({ message: "Đã xóa người dùng" });
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message ?? "Không thể xóa người dùng",
      });
    },
  });
};

export const useRestoreUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      notification.success({ message: "Khôi phục người dùng thành công" });
    },
  });
};

export const useForceDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => forceDeleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users.trash });
    },
  });
};
