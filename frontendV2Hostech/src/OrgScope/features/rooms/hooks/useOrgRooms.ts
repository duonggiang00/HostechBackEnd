import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { orgRoomsApi } from '../api/rooms';
import type { OrgRoomListParams, OrgRoomUpdatePayload } from '../types';

const ORG_ROOMS_KEY = ['org', 'rooms'] as const;

export const useOrgRooms = (params: OrgRoomListParams) => {
  return useQuery({
    queryKey: [...ORG_ROOMS_KEY, params],
    queryFn: ({ signal }) => orgRoomsApi.list(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
};

export const useOrgRoom = (id: string | undefined) => {
  return useQuery({
    queryKey: ['org', 'room', id],
    queryFn: () => orgRoomsApi.show(id as string),
    enabled: !!id,
  });
};

export const useDeleteOrgRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orgRoomsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_ROOMS_KEY });
      toast.success('Đã xóa phòng');
    },
  });
};

export const useUpdateOrgRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrgRoomUpdatePayload }) => orgRoomsApi.update(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ORG_ROOMS_KEY });
      qc.invalidateQueries({ queryKey: ['org', 'room', variables.id] });
      toast.success('Đã cập nhật phòng');
    },
  });
};
