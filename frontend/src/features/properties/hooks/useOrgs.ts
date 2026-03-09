import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../shared/constants/queryKeys";
import { getOrgs, getOrgById } from "../api/orgApi";

// ───── Orgs ─────

export const useOrgs = (search?: string) =>
    useQuery({
        queryKey: QUERY_KEYS.orgs.list({ search } as any),
        queryFn: () => getOrgs(search),
        staleTime: 1000 * 60 * 5, // 5 min cache since orgs don't change often
    });

export const useOrg = (id: string) =>
    useQuery({
        queryKey: QUERY_KEYS.orgs.detail(id),
        queryFn: () => getOrgById(id),
        enabled: !!id,
    });
