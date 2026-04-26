import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/shared/features/management/api/organizations';
import { authApi } from '@/shared/features/auth/api/auth';
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

  /** Direct API call — intentionally not a hook to avoid unstable reference in useEffect deps */
  const validateToken = (token: string) => organizationsApi.validateToken(token);

  const revokeInvitation = useMutation({
    mutationFn: (id: string) => organizationsApi.revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });

  /**
   * Register a new account from an invitation link.
   * Uses Fortify /auth/register (CreateNewUser) to ensure ContractMember backfill occurs.
   */
  const registerFromInvitation = useMutation({
    mutationFn: (data: {
      invite_token: string;
      email: string;
      full_name: string;
      password: string;
      password_confirmation: string;
      phone?: string;
      org_name?: string;
      identity_number?: string;
      identity_issued_date?: string;
      identity_issued_place?: string;
      date_of_birth?: string;
      address?: string;
      license_plate?: string;
    }) => authApi.registerFromInvitation(data),
  });

  return { createInvitation, validateToken, revokeInvitation, registerFromInvitation };
};
