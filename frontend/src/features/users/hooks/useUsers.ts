import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUserStatus, removeUserFromOrg, sendInvitation } from '../api/userApi';
import type { UserFilters, InvitationPayload } from '../types';
import { message } from 'antd';

export const useUsers = (filters: UserFilters) => {
    return useQuery({
        queryKey: ['users', filters],
        queryFn: () => getUsers(filters),
        placeholderData: (previousData) => previousData, // keep old data while refreshing
    });
};

export const useUpdateUserStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, is_active }: { id: string | number, is_active: boolean }) => updateUserStatus(id, { is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            message.success('Đã cập nhật trạng thái người dùng');
        },
        onError: () => {
            message.error('Lỗi khi cập nhật trạng thái');
        }
    });
};

export const useRemoveUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => removeUserFromOrg(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            message.success('Đã gỡ quyền người dùng khỏi Tổ chức');
        },
        onError: () => {
            message.error('Lỗi khi thao tác xóa người dùng');
        }
    });
};

export const useSendInvitation = () => {
    return useMutation({
        mutationFn: (data: InvitationPayload) => sendInvitation(data),
        onSuccess: () => {
            message.success('Đã gửi lời mời thành công');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi lời mời';
            message.error(msg);
        }
    });
};
