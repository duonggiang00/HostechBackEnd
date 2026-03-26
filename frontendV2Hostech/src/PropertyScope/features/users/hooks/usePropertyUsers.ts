import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';

export function usePropertyUsers(params?: Record<string, any>) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['property-users', params],
    queryFn: () => usersApi.getUsers(params),
  });

  const invitationsQuery = useQuery({
    queryKey: ['property-invitations', params],
    queryFn: () => usersApi.getInvitations(params),
  });

  const inviteMutation = useMutation({
    mutationFn: usersApi.inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-invitations'] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-users'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: usersApi.revokeInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-invitations'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<any> }) => usersApi.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['property-users'] });
      queryClient.invalidateQueries({ queryKey: ['property-user', id] });
    },
  });

  return {
    usersQuery,
    invitationsQuery,
    inviteMutation,
    createUserMutation,
    updateUserMutation,
    revokeMutation,
  };
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: ['property-user', id],
    queryFn: () => usersApi.getUser(id!),
    enabled: !!id,
  });
}
