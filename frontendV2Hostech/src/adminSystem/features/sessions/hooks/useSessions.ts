import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi, type Session } from '../api/sessions';

export type { Session };

export const useSessions = () => {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsApi.getSessions(),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => sessionsApi.revokeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const revokeOthersMutation = useMutation({
    mutationFn: () => sessionsApi.revokeOthers(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    revokeSession: revokeMutation.mutate,
    revokeOthers: revokeOthersMutation.mutate,
  };
};
