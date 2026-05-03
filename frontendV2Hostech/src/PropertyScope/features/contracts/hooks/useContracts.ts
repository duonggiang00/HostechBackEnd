import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { contractsApi } from '../api/contracts';
import type {
  Contract,
  ContractQueryParams,
  ContractListResponse,
  CreateContractPayload,
  FinalizeTerminationData,
  TerminationSyncPayload,
} from '../types';
import { isUuid } from '@/lib/utils';

// Re-export types for backward compatibility if needed
export type { Contract, ContractQueryParams };

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const CONTRACTS_KEY = 'contracts';
export const CONTRACT_KEY = 'contract';
export const TRASH_CONTRACTS_KEY = 'contracts-trash';
export const PENDING_CONTRACTS_KEY = 'contracts-pending';
export const MY_CONTRACTS_KEY = 'contracts-my';
export const PENDING_REQUESTS_KEY = 'pending-requests';
export const CONTRACT_TERMINATION_HANDOVER_KEY = 'termination-handover';

/** GET …/termination/linked-final-invoice — hydrate wizard bước HĐ thanh lý */
export const contractTerminationLinkedFinalInvoiceQueryKey = (contractId: string) =>
  [CONTRACT_KEY, contractId, 'termination-linked-final-invoice'] as const;

// ─── List Hooks ───────────────────────────────────────────────────────────────

/**
 * GET /api/contracts
 * Returns { data: Contract[], status_counts: StatusCounts }
 */
export const useContracts = (params?: ContractQueryParams, options?: Partial<UseQueryOptions<ContractListResponse>>) => {
  const propertyId = params?.property_id;

  return useQuery({
    queryKey: [CONTRACTS_KEY, propertyId, params],
    queryFn: async ({ signal }) => {
      return contractsApi.getContracts(params, signal);
    },
    ...options,
    enabled: options?.enabled !== undefined ? options.enabled : true,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes stale time for the list
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes cache time
    placeholderData: keepPreviousData,
  });
};

/**
 * GET /api/contracts/trash
 */
export const useTrashContracts = (params?: ContractQueryParams, options?: Partial<UseQueryOptions<Contract[]>>) => {
  const propertyId = params?.property_id;
  
  return useQuery({
    queryKey: [TRASH_CONTRACTS_KEY, propertyId, params],
    queryFn: ({ signal }) => contractsApi.getTrashContracts(params, signal),
    ...options,
    enabled: options?.enabled !== undefined ? options.enabled : true,
    placeholderData: keepPreviousData,
  });
};

/**
 * GET /api/contracts/{id}
 */
export const useContract = (id?: string) => {
  return useQuery({
    queryKey: [CONTRACT_KEY, id],
    queryFn: async ({ signal }) => {
      if (!id) return null;
      return contractsApi.getContract(id, signal);
    },
    enabled: isUuid(id),
    staleTime: 10 * 60 * 1000, // 10 minutes stale time for contract details
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
  });
};

/**
 * GET /api/contracts/{id}/termination-handover — biên bản / xem trước tài sản phòng.
 */
export const useTerminationHandoverState = (contractId?: string) => {
  return useQuery({
    queryKey: [CONTRACT_KEY, contractId, CONTRACT_TERMINATION_HANDOVER_KEY],
    queryFn: async ({ signal }) => {
      if (!contractId) return null;
      const res = await contractsApi.getTerminationHandover(contractId, signal);
      return res.data;
    },
    enabled: isUuid(contractId),
    staleTime: 60 * 1000,
  });
};

/**
 * GET /api/contracts/my-pending
 */
export const useMyPendingContracts = () => {
  return useQuery({
    queryKey: [PENDING_CONTRACTS_KEY],
    queryFn: () => contractsApi.getMyPendingContracts(),
  });
};

/**
 * GET /api/contracts/{id}/status-histories
 */
export const useContractStatusHistories = (id?: string) => {
  return useQuery({
    queryKey: [CONTRACT_KEY, id, 'status-histories'],
    queryFn: async () => {
      if (!id) return [];
      return contractsApi.getStatusHistories(id);
    },
    enabled: isUuid(id),
    staleTime: 60 * 1000, // 1 minute stale time
  });
};

// ─── Mutation Actions ─────────────────────────────────────────────────────────

/**
 * GET /api/contracts/my-contracts
 */
export const useMyContracts = () => {
  return useQuery({
    queryKey: [MY_CONTRACTS_KEY],
    queryFn: () => contractsApi.getMyContracts(),
  });
};

export const useContractActions = () => {
  const queryClient = useQueryClient();

  const invalidateContracts = () => {
    queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
    queryClient.invalidateQueries({ queryKey: [TRASH_CONTRACTS_KEY] });
    queryClient.invalidateQueries({ queryKey: [PENDING_CONTRACTS_KEY] });
    queryClient.invalidateQueries({ queryKey: [MY_CONTRACTS_KEY] });
    queryClient.invalidateQueries({ queryKey: [PENDING_REQUESTS_KEY] });
  };

  /** POST /api/contracts */
  const createContract = useMutation({
    mutationFn: (data: CreateContractPayload) => contractsApi.createContract(data),
    onSuccess: () => invalidateContracts(),
  });

  /** PUT /api/contracts/{id} */
  const updateContract = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => contractsApi.updateContract(id, data),
    onSuccess: (contract) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, contract?.id] });
      invalidateContracts();
    },
  });

  /** DELETE /api/contracts/{id} */
  const deleteContract = useMutation({
    mutationFn: (id: string) => contractsApi.deleteContract(id),
    onSuccess: () => invalidateContracts(),
  });

  /** POST /api/contracts/{id}/restore */
  const restoreContract = useMutation({
    mutationFn: (id: string) => contractsApi.restoreContract(id),
    onSuccess: () => invalidateContracts(),
  });

  /** DELETE /api/contracts/{id}/force */
  const forceDeleteContract = useMutation({
    mutationFn: (id: string) => contractsApi.forceDeleteContract(id),
    onSuccess: () => invalidateContracts(),
  });

  /** POST /api/contracts/{id}/accept-signature */
  const acceptSignature = useMutation({
    mutationFn: (id: string) => contractsApi.acceptSignature(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      invalidateContracts();
    },
  });

  /** POST /api/contracts/{id}/sign */
  const signContract = useMutation({
    mutationFn: ({ id, signatureDataUrl }: { id: string, signatureDataUrl: string }) => contractsApi.signContract(id, signatureDataUrl),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id, 'status-histories'] });
      invalidateContracts();
      await queryClient.refetchQueries({ queryKey: [CONTRACT_KEY, variables.id], type: 'active' });
    },
  });

  /** POST /api/contracts/{id}/reject-signature */
  const rejectSignature = useMutation({
    mutationFn: (id: string) => contractsApi.rejectSignature(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, id] });
      invalidateContracts();
    },
  });

  /** POST /api/contracts/{id}/room-transfer-request */
  const requestRoomTransfer = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => contractsApi.requestRoomTransfer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      invalidateContracts();
    },
  });

  /** POST /api/contracts/{id}/request-termination */
  const requestTermination = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => contractsApi.requestTermination(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id, 'status-histories'] });
      invalidateContracts();
    },
  });

  /** POST /api/contracts/{id}/request-renewal */
  const requestRenewal = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { requested_end_date: string; reason?: string } }) =>
      contractsApi.requestRenewal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id, 'status-histories'] });
      invalidateContracts();
    },
  });

  /** POST /api/contracts/{id}/approve-renewal */
  const approveRenewal = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { request_index?: number } }) =>
      contractsApi.approveRenewal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id, 'status-histories'] });
      invalidateContracts();
    },
  });

  /** POST /api/contracts/{id}/terminate — 200 (đồng bộ) hoặc 202 (queue EDA) */
  const terminateContract = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: TerminationSyncPayload & { cancellation_reason?: string; forfeit_deposit?: boolean };
    }) => contractsApi.terminateContract(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id, 'status-histories'] });
      invalidateContracts();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
      queryClient.invalidateQueries({ queryKey: ['meter-readings'] });
      queryClient.invalidateQueries({ queryKey: ['meters'] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['property-readings'] });
    },
  });

  /** POST /api/contracts/{id}/terminate/issue-final-invoice */
  const issueFinalInvoice = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: TerminationSyncPayload & { cancellation_reason?: string };
    }) => contractsApi.issueFinalInvoice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id, 'status-histories'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      invalidateContracts();
    },
  });

  /** POST /api/contracts/{id}/terminate/link-final-invoice */
  const linkTerminationFinalInvoice = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { invoice_id: string } & TerminationSyncPayload & { cancellation_reason?: string; refund_remaining_rent?: boolean };
    }) => contractsApi.linkTerminationFinalInvoice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id, 'status-histories'] });
      queryClient.invalidateQueries({ queryKey: contractTerminationLinkedFinalInvoiceQueryKey(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      invalidateContracts();
    },
  });

  /** POST /api/contracts/{id}/terminate/finalize */
  const finalizeTermination = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: FinalizeTerminationData }) =>
      contractsApi.finalizeTermination(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id, 'status-histories'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
      invalidateContracts();
    },
  });

  /** POST /api/contracts/{id}/termination-handover */
  const commitTerminationHandover = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        items?: Array<{ room_asset_id: string; condition?: 'OK' | 'MISSING' | 'DAMAGED' | null }>;
        note?: string | null;
      };
    }) => contractsApi.commitTerminationHandover(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id, CONTRACT_TERMINATION_HANDOVER_KEY] });
      queryClient.invalidateQueries({ queryKey: ['handovers'] });
    },
  });

  /** POST /api/contracts/scan */
  const scanContract = useMutation({
    mutationFn: (file: File) => contractsApi.scanContract(file),
  });

  /** POST /api/contracts/{id}/generate-document */
  const generateDocument = useMutation({
    mutationFn: ({ id, data }: { id: string, data?: any }) => contractsApi.generateDocument(id, data),
  });

  /** GET /api/contracts/{id}/document/download */
  const downloadDocument = useMutation({
    mutationFn: ({ id, revision }: { id: string; revision?: string }) => contractsApi.downloadDocument(id, revision),
  });

  /** POST /api/contracts/{id}/members */
  const addContractMember = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => contractsApi.addContractMember(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [MY_CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PENDING_REQUESTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] }); // To refresh room detail tenants list
    },
  });

  /** PUT /api/contracts/{id}/members/{memberId} */
  const updateContractMember = useMutation({
    mutationFn: ({
      contractId,
      memberId,
      data,
    }: {
      contractId: string;
      memberId: string;
      data: Record<string, unknown>;
    }) => contractsApi.updateContractMember(contractId, memberId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.contractId] });
      queryClient.invalidateQueries({ queryKey: [MY_CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  /** DELETE /api/contracts/{id}/members/{memberId} */
  const removeContractMember = useMutation({
    mutationFn: ({ contractId, memberId }: { contractId: string, memberId: string }) => 
      contractsApi.removeContractMember(contractId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.contractId] });
      queryClient.invalidateQueries({ queryKey: [MY_CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  /** POST /api/contracts/{id}/members/{memberId}/approve */
  const approveContractMember = useMutation({
    mutationFn: ({ contractId, memberId }: { contractId: string, memberId: string }) => 
      contractsApi.approveContractMember(contractId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.contractId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  return {
    createContract,
    updateContract,
    deleteContract,
    restoreContract,
    forceDeleteContract,
    acceptSignature,
    signContract,
    rejectSignature,
    requestRoomTransfer,
    requestTermination,
    requestRenewal,
    approveRenewal,
    terminateContract,
    issueFinalInvoice,
    linkTerminationFinalInvoice,
    finalizeTermination,
    commitTerminationHandover,
    scanContract,
    generateDocument,
    downloadDocument,
    addContractMember,
    updateContractMember,
    removeContractMember,
    approveContractMember,
  };
};

// ─── Pending Requests (Manager Queue) ─────────────────────────────────────────

/**
 * GET /api/properties/{id}/pending-requests
 * Tập hợp tất cả yêu cầu chờ duyệt: chuyển phòng, thêm thành viên, báo dời đi.
 */
export const usePendingRequests = (propertyId?: string) => {
  return useQuery({
    queryKey: [PENDING_REQUESTS_KEY, propertyId],
    queryFn: () => contractsApi.getPendingRequests(propertyId!),
    enabled: !!propertyId,
    staleTime: 30 * 1000, // 30s — refresh thường xuyên hơn để cập nhật hàng chờ
    refetchOnWindowFocus: true,
  });
};

/**
 * PUT /api/contracts/{contractId}/members/{memberId}/approve
 * Duyệt thêm thành viên mới vào hợp đồng.
 */
export const useApproveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, memberId }: { contractId: string; memberId: string }) =>
      contractsApi.approveContractMember(contractId, memberId),
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: [PENDING_REQUESTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, contractId] });
    },
  });
};
