import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { QUERY_KEYS } from "../../../shared/constants/queryKeys";
import {
  getInvoices,
  getDeletedInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  restoreInvoice,
  hardDeleteInvoice,
  addInvoiceItem,
  removeInvoiceItem,
} from "../api/invoiceApi";
import type { InvoiceFormValues, InvoiceItemFormValues } from "../../../Types/InvoiceTypes";
import type { PaginationParams } from "../../../shared/types/Shared";

// ───── Queries ─────

export const useInvoices = (params?: PaginationParams) =>
  useQuery({
    queryKey: QUERY_KEYS.invoices.list(params),
    queryFn: () => getInvoices(),
    staleTime: 1000 * 30,
  });

export const useDeletedInvoices = () =>
  useQuery({
    queryKey: QUERY_KEYS.invoices.trash,
    queryFn: getDeletedInvoices,
  });

export const useInvoice = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.invoices.detail(id),
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
  });

// ───── Mutations ─────

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InvoiceFormValues) => createInvoice(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all });
      notification.success({ message: "Tạo hóa đơn thành công" });
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message ?? "Không thể tạo hóa đơn",
      });
    },
  });
};

export const useUpdateInvoice = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InvoiceFormValues) => updateInvoice(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices.detail(id) });
      notification.success({ message: "Cập nhật hóa đơn thành công" });
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message ?? "Không thể cập nhật hóa đơn",
      });
    },
  });
};

export const useDeleteInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all });
      notification.success({ message: "Đã xóa hóa đơn" });
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message ?? "Không thể xóa hóa đơn",
      });
    },
  });
};

export const useRestoreInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all });
      notification.success({ message: "Khôi phục hóa đơn thành công" });
    },
  });
};

export const useHardDeleteInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hardDeleteInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices.trash });
      notification.success({ message: "Đã xóa vĩnh viễn hóa đơn" });
    },
  });
};

export const useAddInvoiceItem = (invoiceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InvoiceItemFormValues) =>
      addInvoiceItem(invoiceId, data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.invoices.detail(invoiceId),
      });
      notification.success({ message: "Thêm chi phí thành công" });
    },
  });
};

export const useRemoveInvoiceItem = (invoiceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeInvoiceItem(invoiceId, itemId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.invoices.detail(invoiceId),
      });
      notification.success({ message: "Đã xóa chi phí" });
    },
  });
};
