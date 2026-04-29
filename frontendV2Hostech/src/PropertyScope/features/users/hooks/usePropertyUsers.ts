import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';

export type PropertyUserRoleGroup = 'tenant' | 'property_staff';

type ListOptions = {
  propertyId: string;
  roleGroup: PropertyUserRoleGroup;
  page?: number;
  per_page?: number;
  search?: string;
};

/**
 * Danh sách + lời mời theo tòa: truyền `propertyId` + `roleGroup`.
 * Chỉ mutations: gọi không tham số (vd. CreateUser, InviteModal).
 */
export function usePropertyUsers(options?: ListOptions) {
  const queryClient = useQueryClient();
  const propertyId = options?.propertyId;
  const roleGroup = options?.roleGroup;
  const page = options?.page ?? 1;
  const per_page = options?.per_page ?? 15;
  const search = options?.search ?? '';

  const listEnabled = !!(propertyId && roleGroup);

  const usersQuery = useQuery({
    queryKey: ['property-users', propertyId, roleGroup, page, per_page, search],
    queryFn: () =>
      usersApi.getUsers({
        page,
        per_page,
        search,
        property_id: propertyId,
        role_group: roleGroup,
      }),
    enabled: listEnabled,
  });

  const invitationsQuery = useQuery({
    queryKey: ['property-invitations', propertyId, roleGroup, page, per_page],
    queryFn: () =>
      usersApi.getInvitations({
        page,
        per_page,
        role_group: roleGroup,
      }),
    enabled: listEnabled,
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
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) => usersApi.updateUser(id, data),
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
