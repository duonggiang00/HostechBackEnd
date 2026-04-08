import apiClient from '@/shared/api/client';
import type { 
  Room, 
  PriceHistory, 
  RoomQueryParams
} from '../types';

export const roomsApi = {
  getRooms: async (params?: RoomQueryParams, signal?: AbortSignal) => {
    const apiParams: any = {
      'filter[property_id]': params?.property_id || undefined,
      'filter[floor_id]': params?.floor_id || undefined,
      'filter[status]': params?.status || undefined,
      'filter[type]': params?.type || undefined,
      'filter[code]': params?.code || undefined,
      search: params?.search || undefined,
      sort: params?.sort || undefined,
      with_trashed: params?.with_trashed ? 1 : undefined,
      include: params?.include || 'floor,property',
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 50,
      'filter[price_min]': params?.price_min || undefined,
      'filter[price_max]': params?.price_max || undefined,
      'filter[area_min]': params?.area_min || undefined,
      'filter[area_max]': params?.area_max || undefined,
      'filter[capacity_min]': params?.capacity_min || undefined,
      'filter[capacity_max]': params?.capacity_max || undefined,
    };

    const response = await apiClient.get('/rooms', { params: apiParams, signal });
    console.log('📡 API: GET /rooms - Full Response:', response.data);
    
    // Handle paginated response (has data, meta, links)
    if (response.data?.data && Array.isArray(response.data.data)) {
      console.log('📡 Returning paginated data:', response.data.data);
      return response.data.data as Room[];
    }
    
    // Handle direct array response
    if (Array.isArray(response.data)) {
      console.log('📡 Returning array data:', response.data);
      return response.data as Room[];
    }
    
    // Handle wrapped response
    console.log('📡 Returning response.data:', response.data);
    return (response.data || []) as Room[];
  },

  getDraftRooms: async (propertyId?: string) => {
    const response = await apiClient.get('/rooms/drafts', {
      params: { 'filter[property_id]': propertyId || undefined },
    });
    console.log('📡 API: GET /rooms/drafts:', response.data.data || response.data);
    return (response.data.data || response.data) as Room[];
  },

  getTrashRooms: async (params?: RoomQueryParams, signal?: AbortSignal) => {
    const apiParams: any = {
      'filter[property_id]': params?.property_id || undefined,
      'filter[floor_id]': params?.floor_id || undefined,
      'filter[status]': params?.status || undefined,
      'filter[type]': params?.type || undefined,
      'filter[code]': params?.code || undefined,
      search: params?.search || undefined,
      sort: params?.sort || undefined,
      include: params?.include || 'floor,property',
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 50,
      'filter[price_min]': params?.price_min || undefined,
      'filter[price_max]': params?.price_max || undefined,
      'filter[area_min]': params?.area_min || undefined,
      'filter[area_max]': params?.area_max || undefined,
      'filter[capacity_min]': params?.capacity_min || undefined,
      'filter[capacity_max]': params?.capacity_max || undefined,
    };

    const response = await apiClient.get('/rooms/trash', { params: apiParams, signal });
    console.log('📡 API: GET /rooms/trash:', response.data.data || response.data);
    return (response.data.data || response.data) as Room[];
  },

  getRoom: async (id: string, params?: { include?: string }) => {
    const response = await apiClient.get(`/rooms/${id}`, {
      params: { include: params?.include || 'floor,property,assets,prices,statusHistories,media,contracts.members,contracts.tenant,meters.readings,invoices,roomServices.service' },
    });
    console.log(`📡 API: GET /rooms/${id} detail:`, response.data.data);
    return response.data.data as Room;
  },

  getPriceHistories: async (roomId: string) => {
    const response = await apiClient.get(`/rooms/${roomId}/price-histories`);
    console.log(`📡 API: GET /rooms/${roomId}/price-histories:`, response.data.data || response.data);
    return (response.data.data || response.data) as PriceHistory[];
  },

  createRoom: async (data: any) => {
    const response = await apiClient.post('/rooms', data);
    console.log('📡 API: POST /rooms (Created):', response.data.data);
    return response.data.data as Room;
  },

  quickCreateRoom: async (data: { property_id: string; name: string; floor_id?: string }) => {
    const response = await apiClient.post('/rooms/quick', data);
    console.log('📡 API: POST /rooms/quick (Created):', response.data.data);
    return response.data.data as Room;
  },

  quickCreateBatchRooms: async (data: { property_id: string; prefix?: string; count: number; start_number?: number; template_id?: string; floor_id?: string }) => {
    const response = await apiClient.post('/rooms/quick-batch', data);
    console.log('📡 API: POST /rooms/quick-batch (Batch Created):', response.data.data);
    return response.data.data as Room[];
  },

  createRoomFromTemplate: async (data: { template_id: string; name: string; code: string; floor_id?: string }) => {
    const response = await apiClient.post('/rooms/create-from-template', data);
    console.log('📡 API: POST /rooms/create-from-template (Created):', response.data.data);
    return response.data.data as Room;
  },

  updateRoom: async (id: string, data: any) => {
    const response = await apiClient.put(`/rooms/${id}`, data);
    console.log(`📡 API: PUT /rooms/${id} (Updated):`, response.data.data);
    return response.data.data as Room;
  },

  publishRoom: async (id: string, data: any) => {
    const response = await apiClient.post(`/rooms/${id}/publish`, data);
    console.log(`📡 API: POST /rooms/${id}/publish:`, response.data.data);
    return response.data.data as Room;
  },

  deleteRoom: async (id: string) => {
    await apiClient.delete(`/rooms/${id}`);
  },

  restoreRoom: async (id: string) => {
    const response = await apiClient.post(`/rooms/${id}/restore`);
    console.log(`📡 API: POST /rooms/${id}/restore:`, response.data.data);
    return response.data.data as Room;
  },

  forceDeleteRoom: async (id: string) => {
    await apiClient.delete(`/rooms/${id}/force`);
  },

  batchDeleteRooms: async (ids: string[]) => {
    const response = await apiClient.post('/rooms/batch-delete', { ids });
    console.log(`📡 API: POST /rooms/batch-delete:`, response.data);
    return response.data;
  },

  batchRestoreRooms: async (ids: string[]) => {
    const response = await apiClient.post('/rooms/batch-restore', { ids });
    console.log(`📡 API: POST /rooms/batch-restore:`, response.data);
    return response.data;
  },

  batchForceDeleteRooms: async (ids: string[]) => {
    const response = await apiClient.post('/rooms/batch-force-delete', { ids });
    console.log(`📡 API: POST /rooms/batch-force-delete:`, response.data);
    return response.data;
  },

  setFloorPlan: async (id: string, payload: any) => {
    const response = await apiClient.put(`/rooms/${id}/floor-plan`, payload);
    console.log(`📡 API: PUT /rooms/${id}/floor-plan:`, response.data);
    return response.data;
  },

  clearFloorPlan: async (id: string) => {
    await apiClient.delete(`/rooms/${id}/floor-plan`);
  },

  batchSetFloorPlan: async (nodes: any[]) => {
    const response = await apiClient.post('/rooms/batch-floor-plan', { nodes });
    console.log(`📡 API: POST /rooms/batch-floor-plan:`, response.data);
    return response.data;
  },

  addPriceHistory: async (roomId: string, data: { price: number; start_date: string }) => {
    const response = await apiClient.post(`/rooms/${roomId}/price-histories`, data);
    console.log(`📡 API: POST /rooms/${roomId}/price-histories:`, response.data);
    return response.data;
  },
};
