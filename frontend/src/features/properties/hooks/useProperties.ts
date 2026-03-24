import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { QUERY_KEYS } from "../../../shared/constants/queryKeys";
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getDeletedProperties,
  restoreProperty,
  forceDeleteProperty,
  getFloors,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor,
  restoreFloor,
  forceDeleteFloor,
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  restoreRoom,
  forceDeleteRoom,
  generateMonthlyInvoicesForProperty,
} from "../api/propertyApi";
import {
  getMeters,
  getMetersByProperty,
  getMetersByFloor,
} from "../../meters/api/meterApi";
import axiosClient from "../../../shared/api/axiosClient";

// ───── Properties ─────

export const useProperties = (params: any = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.properties.list(params),
    queryFn: () => getProperties(params),
    staleTime: 1000 * 30,
  });

export const useProperty = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.properties.detail(id),
    queryFn: () => getPropertyById(id),
    enabled: !!id,
  });

export const useCreateProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createProperty(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.properties.all });
      notification.success({ message: "Tạo nhà trọ thành công" });
    },
    onError: (err: any) => {
      notification.error({ message: err?.response?.data?.message ?? "Lỗi tạo nhà trọ" });
    },
  });
};

export const useUpdateProperty = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => updateProperty(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.properties.all });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.properties.detail(id) });
      notification.success({ message: "Cập nhật nhà trọ thành công" });
    },
  });
};

export const useDeleteProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.properties.all });
      notification.success({ message: "Đã xóa nhà trọ" });
    },
  });
};

export const useRestoreProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreProperty(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.properties.all }); },
  });
};

export const useDeletedProperties = () =>
  useQuery({
    queryKey: QUERY_KEYS.properties.trash,
    queryFn: getDeletedProperties,
    staleTime: 1000 * 30,
  });

export const useGenerateMonthlyInvoicesProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { billing_date?: string } }) =>
      generateMonthlyInvoicesForProperty(id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invoices?.all || ["invoices"] });
      notification.success({ message: res.message || "Đã chốt tiền tháng cho tòa nhà" });
    },
    onError: (err: any) => {
      notification.error({ message: err?.response?.data?.message ?? "Lỗi chốt tiền tháng" });
    },
  });
};

// ───── Floors ─────

export const useFloors = (params: any = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.floors.list(params),
    queryFn: () => getFloors(params),
    staleTime: 1000 * 30,
  });

export const useFloor = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.floors.detail(id),
    queryFn: () => getFloorById(id),
    enabled: !!id,
  });

export const useCreateFloor = (propertyId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createFloor(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.floors.all });
      if (propertyId) qc.invalidateQueries({ queryKey: QUERY_KEYS.floors.byProperty(propertyId) });
      notification.success({ message: "Tạo tầng thành công" });
    },
  });
};

export const useUpdateFloor = (id: string, propertyId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => updateFloor(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.floors.all });
      if (propertyId) qc.invalidateQueries({ queryKey: QUERY_KEYS.floors.byProperty(propertyId) });
      notification.success({ message: "Cập nhật tầng thành công" });
    },
  });
};

export const useDeleteFloor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFloor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.floors.all });
      notification.success({ message: "Đã xóa tầng" });
    },
  });
};

export const useRestoreFloor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreFloor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.floors.all }); },
  });
};

export const useDeletedFloors = () =>
  useQuery({
    queryKey: QUERY_KEYS.floors.trash,
    queryFn: () => axiosClient.get("floors/trash").then(res => res.data?.data ?? res.data),
    staleTime: 1000 * 30,
  });

export const useFloorsByProperty = (propertyId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.floors.byProperty(propertyId),
    queryFn: () => getFloors({ filter: { property_id: propertyId } }),
    enabled: !!propertyId,
  });

// ───── Rooms ─────

export const useRooms = (params: any = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.rooms.list(params),
    queryFn: () => getRooms(params),
    staleTime: 1000 * 30,
  });

export const useRoom = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.rooms.detail(id),
    queryFn: () => getRoomById(id),
    enabled: !!id,
  });

export const useCreateRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.rooms.all });
      notification.success({ message: "Tạo phòng thành công" });
    },
  });
};

export const useUpdateRoom = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => updateRoom(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.rooms.all });
      notification.success({ message: "Cập nhật phòng thành công" });
    },
  });
};

export const useDeleteRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.rooms.all });
      notification.success({ message: "Đã xóa phòng" });
    },
  });
};

export const useRestoreRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreRoom(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.rooms.all }); },
  });
};

export const useDeletedRooms = () =>
  useQuery({
    queryKey: QUERY_KEYS.rooms.trash,
    queryFn: () => axiosClient.get("rooms/trash").then(res => res.data?.data ?? res.data),
    staleTime: 1000 * 30,
  });

export const useRoomsByProperty = (propertyId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.rooms.byProperty(propertyId),
    queryFn: () => getRooms({ filter: { property_id: propertyId } }),
    enabled: !!propertyId,
  });

export const useForceDeleteProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => forceDeleteProperty(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.properties.trash }); },
  });
};

export const useForceDeleteFloor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => forceDeleteFloor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.floors.trash }); },
  });
};

export const useForceDeleteRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => forceDeleteRoom(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.rooms.trash }); },
  });
};

// ───── Meters ─────

export const useMeters = () =>
  useQuery({
    queryKey: QUERY_KEYS.meters.all,
    queryFn: getMeters,
    staleTime: 1000 * 30,
  });

export const useMetersByProperty = (propertyId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.meters.byProperty(propertyId),
    queryFn: () => getMetersByProperty(propertyId),
    enabled: !!propertyId,
  });

export const useMetersByFloor = (propertyId: string, floorId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.meters.byFloor(propertyId, floorId),
    queryFn: () => getMetersByFloor(propertyId, floorId),
    enabled: !!propertyId && !!floorId,
  });
