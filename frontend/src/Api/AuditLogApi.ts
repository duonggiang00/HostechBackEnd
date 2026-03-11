import Api from "./Api";

// Lấy danh sách audit logs
export const getAuditLogs = async (params?: {
    page?: number;
    per_page?: number;
    user_id?: string;
    subject_type?: string;
    event?: string;
}): Promise<any> => {
    const res = await Api.get("audit-logs", { params });
    return res.data;
};

// Lấy chi tiết audit log theo ID
export const getAuditLogById = async (id: string): Promise<any> => {
    const res = await Api.get(`audit-logs/${id}`);
    return res.data?.data ?? res.data;
};
