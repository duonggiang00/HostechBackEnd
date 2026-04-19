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
    const response = await apiClient.get('/contracts/my-pending');
    return (response.data?.data || response.data) as Contract[];
  },

  getMyContracts: async () => {
    const response = await apiClient.get('/contracts/my-contracts');
    return (response.data?.data || response.data) as Contract[];
  },

  acceptSignature: async (id: string) => {
    const response = await apiClient.post(`/contracts/${id}/accept-signature`);
    return response.data;
  },

  signContract: async (id: string, signature_image: string) => {
    const response = await apiClient.post(`/contracts/${id}/sign`, { signature_image });
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
    const response = await apiClient.post(`/contracts/${id}/room-transfer-request`, data);
    return response.data;
  },

  executeRoomTransfer: async (id: string, data: { 
    target_room_id: string; 
    transfer_date: string; 
    rent_price?: number; 
    deposit_amount?: number; 
    transfer_unused_rent: boolean;
    excess_handling_method?: 'CASH_REFUND' | 'KEEP_AS_CREDIT';
  }) => {
    const response = await apiClient.post(`/contracts/${id}/execute-transfer`, data);
    return response.data;
  },

  requestTermination: async (id: string, data: { reason?: string }) => {
    const response = await apiClient.post(`/contracts/${id}/request-termination`, data);
    return response.data;
  },

  getStatusHistories: async (id: string) => {
    const response = await apiClient.get(`/contracts/${id}/status-histories`);
    return response.data?.data;
  },

  terminateContract: async (id: string, data: { termination_date?: string, cancellation_party?: string, cancellation_reason?: string, waive_penalty?: boolean, refund_remaining_rent?: boolean }) => {
    const response = await apiClient.post(`/contracts/${id}/terminate`, data);
    return response.data;
  },

  generateDocument: async (id: string, data?: { extra_notes?: string; landlord_name?: string; landlord_phone?: string }) => {
    const response = await apiClient.post(`/contracts/${id}/generate-document`, data);
    return response.data; // { message, document_path, download_url }
  },

  downloadDocument: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/contracts/${id}/document/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  scanContract: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // Optional: add template_id if needed in the future
    const response = await apiClient.post('/contracts/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data;
  },

  addContractMember: async (contractId: string, memberData: any) => {
    const response = await apiClient.post(`/contracts/${contractId}/members`, memberData);
    return response.data?.data;
  },

  removeContractMember: async (contractId: string, memberId: string) => {
    const response = await apiClient.delete(`/contracts/${contractId}/members/${memberId}`);
    return response.data;
  },

  approveContractMember: async (contractId: string, memberId: string) => {
    const response = await apiClient.post(`/contracts/${contractId}/members/${memberId}/approve`);
    return response.data?.data;
  }
};
