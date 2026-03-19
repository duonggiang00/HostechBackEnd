import { useQuery } from '@tanstack/react-query';
import { organizationsApi, type Organization } from '../api/organizations';

export type { Organization };

export const useOrganizations = () => {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationsApi.getOrganizations(),
  });
};
