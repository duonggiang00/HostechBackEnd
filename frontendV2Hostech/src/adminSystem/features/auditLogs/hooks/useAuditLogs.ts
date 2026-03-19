import { useQuery } from '@tanstack/react-query';
import { auditApi, type AuditLog } from '../api/audit';
import { useScopeStore } from '@/shared/stores/useScopeStore';

export type { AuditLog };

export const useAuditLogs = (page = 1, perPage = 20) => {
  const { organizationId } = useScopeStore();

  return useQuery({
    queryKey: ['audit-logs', organizationId, page, perPage],
    queryFn: () => auditApi.getAuditLogs({ page, per_page: perPage }),
  });
};
