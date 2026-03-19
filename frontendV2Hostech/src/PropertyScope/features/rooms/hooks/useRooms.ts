import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '../api/rooms';
import type { Room, RoomStatus, PriceHistory, RoomQueryParams, CreateRoomPayload } from '../types';
import { useScopeStore } from '@/shared/stores/useScopeStore';
import toast from 'react-hot-toast';
import { isUuid } from '@/lib/utils';

// Re-export types for backward compatibility if needed, or import directly from API
export type { Room, RoomStatus, PriceHistory, CreateRoomPayload };

// ─── Query Keys ───────────────────────────────────────────────────────────────

const ROOMS_KEY = 'rooms';
const ROOM_KEY = 'room';
const DRAFTS_KEY = 'rooms-drafts';
const TRASH_KEY = 'rooms-trash';
const PRICE_HISTORY_KEY = 'room-price-histories';

// ─── List Hooks ───────────────────────────────────────────────────────────────

/**
 * GET /api/rooms
 */
export const useRooms = (params?: RoomQueryParams) => {
  const { propertyId: scopedPropertyId } = useScopeStore();
  const propertyId = params?.property_id || scopedPropertyId;

  return useQuery({
    queryKey: [ROOMS_KEY, propertyId, params],
    queryFn: async () => {
      const rooms = await roomsApi.getRooms({
        ...params,
        property_id: propertyId || undefined,
      });
      // Flatten floor_plan_node coords for FloorPlanViewer compatibility
      return rooms.map(room => ({
        ...room,
        _x: Number(room.floor_plan_node?.x ?? 0),
        _y: Number(room.floor_plan_node?.y ?? 0),
        _width: Number(room.floor_plan_node?.width ?? 120),
        _height: Number(room.floor_plan_node?.height ?? 100),
      }));
    },
    enabled: isUuid(propertyId),
    staleTime: 60 * 1000, // 1 minute stale time for the list
  });
};

/**
 * GET /api/rooms/drafts
 */
export const useDraftRooms = (propertyId?: string) => {
  const { propertyId: scopedId } = useScopeStore();
  const pid = propertyId || scopedId;
  return useQuery({
    queryKey: [DRAFTS_KEY, pid],
    queryFn: () => roomsApi.getDraftRooms(pid || undefined),
    enabled: isUuid(pid),
  });
};

/**
 * GET /api/rooms/trash
 */
export const useTrashRooms = (propertyId?: string) => {
  const { propertyId: scopedId } = useScopeStore();
  const pid = propertyId || scopedId;
  return useQuery({
    queryKey: [TRASH_KEY, pid],
    queryFn: () => roomsApi.getTrashRooms(pid || undefined),
    enabled: isUuid(pid),
  });
};

/**
 * GET /api/rooms/{id}
 */
export const useRoom = (id?: string) => {
  return useQuery({
    queryKey: [ROOM_KEY, id],
    queryFn: async () => {
      if (!id) return null;
      return roomsApi.getRoom(id);
    },
    enabled: isUuid(id),
  });
};

/**
 * GET /api/rooms/{id} - Consolidated Detail
 */
export const useRoomDetail = (id?: string) => {
  return useQuery({
    queryKey: [ROOM_KEY, 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      return roomsApi.getRoom(id);
    },
    enabled: isUuid(id),
    staleTime: 5 * 60 * 1000, // 5 mins stale time for consolidated detail
  });
};

// ─── Price History Hooks ──────────────────────────────────────────────────────

/**
 * GET /api/rooms/{id}/price-histories
 */
export const usePriceHistories = (roomId?: string) => {
  return useQuery({
    queryKey: [PRICE_HISTORY_KEY, roomId],
    queryFn: async () => {
      if (!roomId) return [] as PriceHistory[];
      return roomsApi.getPriceHistories(roomId);
    },
    enabled: !!roomId,
  });
};

// ─── Mutation Actions ─────────────────────────────────────────────────────────

export const useRoomActions = () => {
  const queryClient = useQueryClient();

  const invalidateRooms = () => {
    queryClient.invalidateQueries({ queryKey: [ROOMS_KEY] });
    queryClient.invalidateQueries({ queryKey: [DRAFTS_KEY] });
    queryClient.invalidateQueries({ queryKey: [TRASH_KEY] });
  };

  /** POST /api/rooms — full create */
  const createRoom = useMutation({
    mutationFn: (data: any) => roomsApi.createRoom(data),
    onSuccess: () => invalidateRooms(),
  });

  /** POST /api/rooms/quick — quick draft */
  const quickCreateRoom = useMutation({
    mutationFn: (data: { property_id: string; name: string; floor_id?: string }) => 
      roomsApi.quickCreateRoom(data),
    onSuccess: () => invalidateRooms(),
  });

  /** Batch quick-create */
  const batchCreateRooms = useMutation({
    mutationFn: async ({
      property_id,
      floor_id,
      count,
      start_number,
      prefix,
    }: {
      property_id: string;
      floor_id?: string;
      count: number;
      start_number: number;
      prefix: string;
    }) => {
      const calls = Array.from({ length: count }, (_, i) =>
        roomsApi.quickCreateRoom({
          property_id,
          floor_id: floor_id || undefined,
          name: `${prefix} ${start_number + i}`,
        })
      );
      return Promise.all(calls);
    },
    onSuccess: () => invalidateRooms(),
  });

  /** PUT /api/rooms/{id} */
  const updateRoom = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => roomsApi.updateRoom(id, data),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: [ROOM_KEY, room?.id] });
      invalidateRooms();
    },
  });

  /** POST /api/rooms/{id}/publish */
  const publishRoom = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => roomsApi.publishRoom(id, data),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: [ROOM_KEY, room?.id] });
      invalidateRooms();
    },
  });

  /** DELETE /api/rooms/{id} — soft delete */
  const deleteRoom = useMutation({
    mutationFn: (id: string) => roomsApi.deleteRoom(id),
    onSuccess: () => invalidateRooms(),
  });

  /** POST /api/rooms/{id}/restore */
  const restoreRoom = useMutation({
    mutationFn: (id: string) => roomsApi.restoreRoom(id),
    onSuccess: () => invalidateRooms(),
  });

  /** DELETE /api/rooms/{id}/force */
  const forceDeleteRoom = useMutation({
    mutationFn: (id: string) => roomsApi.forceDeleteRoom(id),
    onSuccess: () => invalidateRooms(),
  });

  /** POST /api/rooms/batch-delete */
  const batchDeleteRooms = useMutation({
    mutationFn: (ids: string[]) => roomsApi.batchDeleteRooms(ids),
    onSuccess: () => invalidateRooms(),
  });

  /** POST /api/rooms/batch-restore */
  const batchRestoreRooms = useMutation({
    mutationFn: (ids: string[]) => roomsApi.batchRestoreRooms(ids),
    onSuccess: () => invalidateRooms(),
  });

  /** POST /api/rooms/batch-force-delete */
  const batchForceDeleteRooms = useMutation({
    mutationFn: (ids: string[]) => roomsApi.batchForceDeleteRooms(ids),
    onSuccess: () => invalidateRooms(),
  });

  /** PUT /api/rooms/{id}/floor-plan */
  const setFloorPlan = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & any) => roomsApi.setFloorPlan(id, payload),
    onSuccess: () => invalidateRooms(),
  });

  /** DELETE /api/rooms/{id}/floor-plan */
  const clearFloorPlan = useMutation({
    mutationFn: (id: string) => roomsApi.clearFloorPlan(id),
    onSuccess: () => invalidateRooms(),
  });

  /** POST /api/rooms/batch-floor-plan */
  const batchSetFloorPlan = useMutation({
    mutationFn: (nodes: any[]) => roomsApi.batchSetFloorPlan(nodes),
    onSuccess: () => invalidateRooms(),
  });

  /** POST /api/rooms/{id}/price-histories */
  const addPriceHistory = useMutation({
    mutationFn: ({ roomId, ...data }: { roomId: string; price: number; start_date: string }) => 
      roomsApi.addPriceHistory(roomId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRICE_HISTORY_KEY, variables.roomId] });
    },
  });

  /** Update room status shorthand */
  const updateRoomStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoomStatus }) => 
      roomsApi.updateRoom(id, { status }),
    onSuccess: () => invalidateRooms(),
  });

  return {
    createRoom,
    quickCreateRoom,
    batchCreateRooms,
    updateRoom,
    updateRoomStatus,
    publishRoom,
    deleteRoom,
    restoreRoom,
    forceDeleteRoom,
    batchDeleteRooms,
    batchRestoreRooms,
    batchForceDeleteRooms,
    setFloorPlan,
    clearFloorPlan,
    batchSetFloorPlan,
    addPriceHistory,
  };
};
