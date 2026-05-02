import apiClient from '@/shared/api/client';
import type {
  OrgRoomListItem,
  OrgRoomListParams,
  OrgRoomListResponse,
  OrgRoomUpdatePayload,
  Room,
} from '../types';

function buildQuery(params: OrgRoomListParams): Record<string, unknown> {
  const query: Record<string, unknown> = {
    page: params.page ?? 1,
    per_page: params.per_page ?? 15,
  };
  if (params.search) query.search = params.search;
  if (params.status) query['filter[status]'] = params.status;
  if (params.property_id) query['filter[property_id]'] = params.property_id;
  if (params.sort) query.sort = params.sort;
  return query;
}

export const orgRoomsApi = {
  list: async (params: OrgRoomListParams = {}, signal?: AbortSignal): Promise<OrgRoomListResponse> => {
    const res = await apiClient.get('/rooms', { params: buildQuery(params), signal });
    const payload = res.data ?? {};
    return {
      data: (payload.data ?? []) as OrgRoomListItem[],
      meta: payload.meta ?? {
        current_page: 1,
        last_page: 1,
        total: Array.isArray(payload.data) ? payload.data.length : 0,
        per_page: params.per_page ?? 15,
      },
    };
  },

  show: async (id: string): Promise<Room> => {
    const res = await apiClient.get(`/rooms/${id}`, {
      params: { include: 'floor,property,activeContract.members' },
    });
    return (res.data?.data ?? res.data) as Room;
  },

  update: async (id: string, body: OrgRoomUpdatePayload): Promise<Room> => {
    const res = await apiClient.put(`/rooms/${id}`, body);
    return (res.data?.data ?? res.data) as Room;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },
};
