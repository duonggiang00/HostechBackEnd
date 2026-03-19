import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type User } from '../api/users';
import { useScopeStore } from '@/shared/stores/useScopeStore';

export type { User };

export const useUsers = (page = 1, perPage = 15, search = '') => {
  const { organizationId } = useScopeStore();

  return useQuery({
    queryKey: ['users', organizationId, page, perPage, search],
    queryFn: () => usersApi.getUsers({ page, per_page: perPage, search }),
  });
};

export const useUserActions = () => {
  const queryClient = useQueryClient();

  const deleteUser = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      usersApi.toggleUserStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return { deleteUser, toggleUserStatus };
};
