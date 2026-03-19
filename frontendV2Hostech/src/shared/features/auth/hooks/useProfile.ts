import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import { useAuthStore } from '../stores/useAuthStore';
import { useEffect } from 'react';

export const useProfile = () => {
  const { updateUser, isAuthenticated } = useAuthStore();

  const query = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Sync state with store when data changes
  useEffect(() => {
    if (query.data) {
      updateUser({
        permissions: query.data.permissions,
        // Update other fields as well if needed
      });
    }
  }, [query.data, updateUser]);

  return query;
};
