import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { QUERY_KEYS } from "../../../shared/constants/queryKeys";
import {
  getServices,
  getDeletedServices,
  createService,
  updateService,
  deleteService,
  restoreService,
  forceDeleteService,
} from "../api/serviceApi";
import type { ServiceFormValues } from "../../../Types/ServiceTypes";

// ───── Queries ─────

export const useServices = () =>
  useQuery({
    queryKey: QUERY_KEYS.services.list(),
    queryFn: getServices,
    staleTime: 1000 * 60, // 1 phút — services ít thay đổi
  });

export const useDeletedServices = () =>
  useQuery({
    queryKey: QUERY_KEYS.services.trash,
    queryFn: getDeletedServices,
  });

// ───── Mutations ─────

export const useCreateService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ServiceFormValues) => createService(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.services.all });
      notification.success({ message: "Tạo dịch vụ thành công" });
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message ?? "Không thể tạo dịch vụ",
      });
    },
  });
};

export const useUpdateService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceFormValues }) =>
      updateService(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.services.all });
      notification.success({ message: "Cập nhật dịch vụ thành công" });
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message ?? "Không thể cập nhật dịch vụ",
      });
    },
  });
};

export const useDeleteService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.services.all });
      notification.success({ message: "Đã xóa dịch vụ" });
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message ?? "Không thể xóa dịch vụ",
      });
    },
  });
};

export const useRestoreService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.services.all });
      notification.success({ message: "Khôi phục dịch vụ thành công" });
    },
  });
};

export const useForceDeleteService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => forceDeleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.services.trash });
      notification.success({ message: "Đã xóa vĩnh viễn dịch vụ" });
    },
  });
};
