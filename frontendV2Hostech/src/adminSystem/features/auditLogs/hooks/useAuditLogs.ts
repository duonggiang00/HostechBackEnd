import { useQuery } from '@tanstack/react-query';
import { auditApi, type AuditLog } from '../api/audit';

export type { AuditLog };

export const useAuditLogs = (organizationId?: string | null, page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ['audit-logs', organizationId, page, perPage],
    queryFn: () => auditApi.getAuditLogs({ page, per_page: perPage }),
  });
};
