import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi } from '../api/operations';
import type { Asset } from '../types';

export type { Asset };

export const useAssets = (propertyId: string | undefined, roomId: string | undefined) => {
  return useQuery({
    queryKey: ['assets', propertyId, roomId],
    queryFn: () => {
      if (!propertyId || !roomId) return [];
      return operationsApi.getAssets(propertyId, roomId);
    },
    enabled: !!propertyId && !!roomId,
  });
};

export const useAssetActions = (propertyId: string | undefined, roomId: string | undefined) => {
  const queryClient = useQueryClient();

  const addAsset = useMutation({
    mutationFn: (data: Partial<Asset>) => 
      operationsApi.addAsset(propertyId!, roomId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', propertyId, roomId] });
    },
  });

  return { addAsset };
};
