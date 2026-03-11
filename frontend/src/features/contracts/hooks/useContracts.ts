import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { QUERY_KEYS } from "../../../shared/constants/queryKeys";
import {
  getContracts,
  getDeletedContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  restoreContract,
  hardDeleteContract,
} from "../api/contractApi";
import type { ContractFormValues } from "../../../Types/ContractTypes";
import type { PaginationParams } from "../../../shared/types/Shared";

// ───── Queries ─────

export const useContracts = (params?: PaginationParams) =>
  useQuery({
    queryKey: QUERY_KEYS.contracts.list(params),
    queryFn: () => getContracts(),
    staleTime: 1000 * 30,
  });

export const useDeletedContracts = () =>
  useQuery({
    queryKey: QUERY_KEYS.contracts.trash,
    queryFn: getDeletedContracts,
  });

export const useContract = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.contracts.detail(id),
    queryFn: () => getContractById(id),
    enabled: !!id,
  });

// ───── Mutations ─────

export const useCreateContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContractFormValues) => createContract(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.contracts.all });
      notification.success({ message: "Tạo hợp đồng thành công" });
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message ?? "Không thể tạo hợp đồng",
      });
    },
  });
};

export const useUpdateContract = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContractFormValues) => updateContract(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.contracts.all });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.contracts.detail(id) });
      notification.success({ message: "Cập nhật hợp đồng thành công" });
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message ?? "Không thể cập nhật hợp đồng",
      });
    },
  });
};

export const useDeleteContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.contracts.all });
      notification.success({ message: "Đã xóa hợp đồng" });
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message ?? "Không thể xóa hợp đồng",
      });
    },
  });
};

export const useRestoreContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreContract(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.contracts.all });
      notification.success({ message: "Khôi phục hợp đồng thành công" });
    },
  });
};

export const useHardDeleteContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hardDeleteContract(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.contracts.trash });
      notification.success({ message: "Đã xóa vĩnh viễn hợp đồng" });
    },
  });
};
