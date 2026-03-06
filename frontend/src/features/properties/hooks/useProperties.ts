import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { QUERY_KEYS } from "../../../shared/constants/queryKeys";
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  restoreProperty,
  forceDeleteProperty,
  getDeletedProperties,
  getFloors,
  getFloorsByProperty,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor,
  restoreFloor,
  getDeletedFloors,
  getRooms,
  getRoomsByProperty,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  restoreRoom,
  getDeletedRooms,
} from "../api/propertyApi";

// ───── Properties ─────

export const useProperties = (search?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.properties.list({ search } as any),
    queryFn: () => getProperties(search),
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


// ───── Floors ─────

export const useFloors = (search?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.floors.list({ search } as any),
    queryFn: () => getFloors(search),
    staleTime: 1000 * 30,
  });

export const useFloorsByProperty = (propertyId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.floors.byProperty(propertyId),
    queryFn: () => getFloorsByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 1000 * 30,
  });

export const useFloor = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.floors.detail(id),
    queryFn: () => getFloorById(id),
    enabled: !!id,
  });

export const useCreateFloor = (propertyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createFloor(propertyId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.floors.byProperty(propertyId) });
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
    queryFn: getDeletedFloors,
    staleTime: 1000 * 30,
  });

// ───── Rooms ─────

export const useRooms = (search?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.rooms.list({ search } as any),
    queryFn: () => getRooms(search),
    staleTime: 1000 * 30,
  });

export const useRoomsByProperty = (propertyId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.rooms.byProperty(propertyId),
    queryFn: () => getRoomsByProperty(propertyId),
    enabled: !!propertyId,
  });

export const useRoom = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.rooms.detail(id),
    queryFn: () => getRoomById(id),
    enabled: !!id,
  });

export const useCreateRoom = (propertyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createRoom(propertyId, data),
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
    queryFn: getDeletedRooms,
    staleTime: 1000 * 30,
  });

export const useForceDeleteProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => forceDeleteProperty(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.properties.trash }); },
  });
};
