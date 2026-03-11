import axiosClient from "../../../shared/api/axiosClient";
import type { AuditLogType, MediaUploadResponse } from "../types";

// Upload Media
export const uploadMedia = async (file: File, collection?: string): Promise<MediaUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (collection) {
        formData.append("collection", collection);
    }
    const res = await axiosClient.post("media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
};

// Lấy danh sách Audit Logs
export const getAuditLogs = async (): Promise<AuditLogType[]> => {
    const res = await axiosClient.get("audit-logs");
    return res.data?.data ?? res.data;
};

// Validate Invitation Token
export const validateInvitation = async (token: string): Promise<any> => {
    const res = await axiosClient.get(`invitations/validate/${token}`);
    return res.data?.data ?? res.data;
};
