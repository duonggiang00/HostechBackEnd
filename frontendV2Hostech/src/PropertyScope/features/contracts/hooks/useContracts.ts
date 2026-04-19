import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { contractsApi } from '../api/contracts';
import type { Contract, ContractQueryParams, ContractListResponse, CreateContractPayload } from '../types';
import { isUuid } from '@/lib/utils';

// Re-export types for backward compatibility if needed
export type { Contract, ContractQueryParams };

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const CONTRACTS_KEY = 'contracts';
export const CONTRACT_KEY = 'contract';
export const TRASH_CONTRACTS_KEY = 'contracts-trash';
export const PENDING_CONTRACTS_KEY = 'contracts-pending';
export const MY_CONTRACTS_KEY = 'contracts-my';

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id, 'status-histories'] });
      invalidateContracts();
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

  /** POST /api/contracts/{id}/terminate */
  const terminateContract = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => contractsApi.terminateContract(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id, 'status-histories'] });
      invalidateContracts();
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
    mutationFn: (id: string) => contractsApi.downloadDocument(id),
  });

  /** POST /api/contracts/{id}/members */
  const addContractMember = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => contractsApi.addContractMember(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] }); // To refresh room detail tenants list
    },
  });

  /** DELETE /api/contracts/{id}/members/{memberId} */
  const removeContractMember = useMutation({
    mutationFn: ({ contractId, memberId }: { contractId: string, memberId: string }) => 
      contractsApi.removeContractMember(contractId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACT_KEY, variables.contractId] });
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
    terminateContract,
    scanContract,
    generateDocument,
    downloadDocument,
    addContractMember,
    removeContractMember,
    approveContractMember,
  };
};
