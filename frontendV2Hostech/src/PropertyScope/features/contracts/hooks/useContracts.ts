import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '../api/contracts';
import type { Contract } from '../types';

export type { Contract };

export function useContracts(roomId?: string | null, options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['contracts', roomId],
    queryFn: () => {
      if (!roomId) return [];
      return contractsApi.getContracts(roomId);
    },
    enabled: options.enabled !== undefined ? options.enabled && !!roomId : !!roomId,
  });

  const createContract = useMutation({
    mutationFn: (newContract: Partial<Contract>) => contractsApi.createContract(newContract),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  return {
    ...query,
    createContract,
  };
}
