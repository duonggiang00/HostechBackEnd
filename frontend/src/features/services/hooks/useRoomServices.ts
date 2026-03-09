import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Api from "../../../shared/api/axiosClient";
import type { Service } from "../types";

export interface RoomService {
  id: string;
  room_id: string;
  service_id: string;
  quantity: number;
  included_units: number;
  meta: Record<string, any> | null;
  service?: Service; // Nested relation
}

export interface AssignServicePayload {
  service_id: string;
  quantity: number;
  included_units?: number;
  meta?: Record<string, any>;
}

export interface UpdateRoomServicePayload {
  quantity?: number;
  included_units?: number;
  meta?: Record<string, any>;
}

// Lấy danh sách dịch vụ của phòng
export const getRoomServices = async (roomId: string): Promise<RoomService[]> => {
  const res = await Api.get(`rooms/${roomId}/services`);
  return res.data?.data ?? res.data;
};

// Gán dịch vụ vào phòng
export const assignRoomService = async (roomId: string, data: AssignServicePayload): Promise<RoomService> => {
  const res = await Api.post(`rooms/${roomId}/services`, data);
  return res.data?.data ?? res.data;
};

// Cập nhật dịch vụ phòng
export const updateRoomService = async (roomId: string, id: string, data: UpdateRoomServicePayload): Promise<RoomService> => {
  const res = await Api.put(`rooms/${roomId}/services/${id}`, data);
  return res.data?.data ?? res.data;
};

// Gỡ dịch vụ
export const removeRoomService = async (roomId: string, id: string): Promise<void> => {
  await Api.delete(`rooms/${roomId}/services/${id}`);
};

export const useRoomServices = (roomId: string) => {
  return useQuery({
    queryKey: ["roomServices", roomId],
    queryFn: () => getRoomServices(roomId),
    enabled: !!roomId,
  });
};

export const useAssignRoomService = (roomId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignServicePayload) => assignRoomService(roomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomServices", roomId] });
    },
  });
};

export const useUpdateRoomService = (roomId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoomServicePayload }) => updateRoomService(roomId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomServices", roomId] });
    },
  });
};

export const useRemoveRoomService = (roomId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeRoomService(roomId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomServices", roomId] });
    },
  });
};
