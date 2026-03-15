import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrgs, getOrgDetail, createOrg, updateOrg } from '../api/orgApi';
import type { OrgCreatePayload, OrgUpdatePayload } from '../types';
import { message } from 'antd';

export const useOrgs = (orgId?: string | null) => {
    return useQuery({
        queryKey: ['organizations', orgId],
        queryFn: () => getOrgs(orgId ? { filter: { id: orgId } } : {}),
    });
};

export const useOrgDetail = (id: string | null) => {
    return useQuery({
        queryKey: ['organizations', id],
        queryFn: () => getOrgDetail(id!),
        enabled: !!id,
    });
};

export const useCreateOrg = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: OrgCreatePayload) => createOrg(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            message.success('Đã tạo tổ chức thành công');
        },
        onError: () => {
            message.error('Có lỗi xảy ra khi tạo tổ chức');
        }
    });
};

export const useUpdateOrg = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: OrgUpdatePayload }) => updateOrg(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            queryClient.invalidateQueries({ queryKey: ['organizations', variables.id] });
            message.success('Cập nhật thông tin tổ chức thành công');
        },
        onError: () => {
            message.error('Có lỗi xảy ra khi cập nhật tổ chức');
        }
    });
};
