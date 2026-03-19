import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/shared/features/management/api/organizations';
import type { UserInvitation, InvitationValidation } from '@/shared/features/management/types';

export type { UserInvitation, InvitationValidation };

export const useInvitations = () => {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: () => organizationsApi.getInvitations(),
  });
};

export const useInvitationActions = () => {
  const queryClient = useQueryClient();

  const createInvitation = useMutation({
    mutationFn: (data: { email: string; role_name: string; org_id?: string; properties_scope?: string[] }) => 
      organizationsApi.createInvitation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });

  const validateToken = (token: string) => organizationsApi.validateToken(token);

  const revokeInvitation = useMutation({
    mutationFn: (id: string) => organizationsApi.revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });

  const acceptInvitation = useMutation({
    mutationFn: (data: { token: string; full_name: string; password: string; password_confirmation: string; org_name?: string }) => 
      organizationsApi.acceptInvitation(data),
  });

  return { createInvitation, validateToken, revokeInvitation, acceptInvitation };
};
