import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { floorsApi } from '../api/floors';
import type { Floor } from '../types/floors';

const isUuid = (id?: string | null): boolean => {
  if (!id) return false;
  const standardUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return standardUuidRegex.test(id);
};

export type { Floor };

export const useFloors = (propertyId?: string, showTrash = false) => {
  return useQuery({
    queryKey: ['floors', propertyId, showTrash],
    queryFn: () => showTrash ? floorsApi.getFloorsTrash(propertyId) : floorsApi.getFloors(propertyId),
    enabled: isUuid(propertyId),
  });
};

export const useFloorDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ['floor', id],
    queryFn: async () => {
      if (!id) return null;
      return floorsApi.getFloor(id);
    },
    enabled: isUuid(id),
  });
};

export const useFloorActions = () => {
  const queryClient = useQueryClient();

  const createFloor = useMutation({
    mutationFn: (data: Partial<Floor>) => floorsApi.createFloor(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['floors', variables.property_id] });
    },
  });

  const updateFloor = useMutation({
    mutationFn: ({ id, ...data }: Partial<Floor> & { id: string }) => 
      floorsApi.updateFloor(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['floors', data.property_id] });
    },
  });

  const uploadFloorPlan = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => 
      floorsApi.uploadFloorPlan(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    }
  });

  const deleteFloor = useMutation({
    mutationFn: (id: string) => floorsApi.deleteFloor(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [ 'floors' ] });
      queryClient.invalidateQueries({ queryKey: [ 'floor', id ] });
    },
  });

  const restoreFloor = useMutation({
    mutationFn: (id: string) => floorsApi.restoreFloor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'floors' ] });
    },
  });

  const forceDeleteFloor = useMutation({
    mutationFn: (id: string) => floorsApi.forceDeleteFloor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'floors' ] });
    },
  });

  return { createFloor, updateFloor, deleteFloor, uploadFloorPlan, restoreFloor, forceDeleteFloor };
};
