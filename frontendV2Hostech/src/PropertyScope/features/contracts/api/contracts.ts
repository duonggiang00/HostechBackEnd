import apiClient from '@/shared/api/client';
import type { Contract, ContractQueryParams, ContractListResponse, CreateContractPayload } from '../types';

export const contractsApi = {
  getContracts: async (params?: ContractQueryParams, signal?: AbortSignal): Promise<ContractListResponse> => {
    const apiParams: Record<string, any> = {
      'filter[property_id]': params?.property_id || undefined,
      'filter[room_id]': params?.room_id || undefined,
      'filter[status]': params?.status || undefined,
      search: params?.search || undefined,
      sort: params?.sort || undefined,
      with_trashed: params?.with_trashed ? 1 : undefined,
      include: params?.include || 'property,room,members.user,createdBy',
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 15,
    };

    const response = await apiClient.get('/contracts', { params: apiParams, signal });

    // Handle paginated response with status_counts
    const data = response.data?.data && Array.isArray(response.data.data)
      ? response.data.data as Contract[]
      : (response.data || []) as Contract[];

    const status_counts = response.data?.status_counts ?? {
      total: 0, DRAFT: 0, PENDING_SIGNATURE: 0, PENDING_PAYMENT: 0,
      ACTIVE: 0, ENDED: 0, CANCELLED: 0, expiring: 0,
    };

    return { data, status_counts };
  },

  getTrashContracts: async (params?: ContractQueryParams, signal?: AbortSignal) => {
    const apiParams: Record<string, any> = {
      'filter[property_id]': params?.property_id || undefined,
      'filter[room_id]': params?.room_id || undefined,
      'filter[status]': params?.status || undefined,
      search: params?.search || undefined,
      sort: params?.sort || undefined,
      include: params?.include || 'property,room,members.user,createdBy',
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 15,
    };

    const response = await apiClient.get('/contracts/trash', { params: apiParams, signal });
    return (response.data?.data || response.data) as Contract[];
  },

  getContract: async (id: string, signal?: AbortSignal) => {
    const response = await apiClient.get(`/contracts/${id}`, {
      params: { include: 'property,room,members.user,createdBy,invoices' },
      signal,
    });
    return response.data?.data as Contract;
  },

  createContract: async (data: CreateContractPayload) => {
    const response = await apiClient.post('/contracts', data);
    return response.data?.data as Contract;
  },

  updateContract: async (id: string, data: Partial<CreateContractPayload>) => {
    const response = await apiClient.put(`/contracts/${id}`, data);
    return response.data?.data as Contract;
  },

  deleteContract: async (id: string) => {
    const response = await apiClient.delete(`/contracts/${id}`);
    return response.data;
  },

  restoreContract: async (id: string) => {
    const response = await apiClient.post(`/contracts/${id}/restore`);
    return response.data?.data as Contract;
  },

  forceDeleteContract: async (id: string) => {
    const response = await apiClient.delete(`/contracts/${id}/force`);
    return response.data;
  },

  getMyPendingContracts: async () => {
    const response = await apiClient.get('/contracts/my-pending-contracts');
    return (response.data?.data || response.data) as Contract[];
  },

  acceptSignature: async (id: string) => {
    const response = await apiClient.post(`/contracts/${id}/accept-signature`);
    return response.data;
  },

  rejectSignature: async (id: string) => {
    const response = await apiClient.post(`/contracts/${id}/reject-signature`);
    return response.data;
  },

  getAvailableRooms: async (id: string) => {
    const response = await apiClient.get(`/contracts/${id}/available-rooms`);
    return response.data;
  },

  requestRoomTransfer: async (id: string, data: any) => {
    const response = await apiClient.post(`/contracts/${id}/room-transfer`, data);
    return response.data;
  }
};
