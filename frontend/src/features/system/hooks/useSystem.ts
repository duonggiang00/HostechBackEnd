import { useQuery, useMutation } from '@tanstack/react-query';
import { uploadMedia, getAuditLogs, validateInvitation } from '../api/systemApi';
import { message } from 'antd';

// Hook để fetch Audit Logs
export const useAuditLogs = () => {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: getAuditLogs,
  });
};

// Hook upload Media chung
export const useUploadMedia = () => {
  return useMutation({
    mutationFn: ({ file, collection }: { file: File; collection?: string }) => uploadMedia(file, collection),
    onSuccess: () => {
      // Thành công thì không cần báo message vì có thể upload hàng loạt
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi tải file lên hệ thống!');
    },
  });
};

// Hook validate Invitation Token
export const useValidateInvitation = (token: string | null) => {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () => validateInvitation(token!),
    enabled: !!token,
    retry: false, // Không retry nếu token sai
  });
};
