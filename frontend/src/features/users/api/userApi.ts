import Api from "../../../Api/Api";

// ───── Users ─────

export const getUsers = async (params?: Record<string, any>): Promise<any[]> => {
    const res = await Api.get("users", { params });
    return res.data?.data ?? res.data;
};

export const getUserById = async (id: string): Promise<any> => {
    const res = await Api.get(`users/${id}`);
    return res.data?.data ?? res.data;
};

export const createUser = async (data: any): Promise<any> => {
    const res = await Api.post("users", data);
    return res.data?.data ?? res.data;
};

export const updateUser = async (id: string, data: any): Promise<any> => {
    const res = await Api.put(`users/${id}`, data);
    return res.data?.data ?? res.data;
};

export const deleteUser = async (id: string): Promise<void> => {
    await Api.delete(`users/${id}`);
};

export const getDeletedUsers = async (): Promise<any[]> => {
    const res = await Api.get("users/trash");
    return res.data?.data ?? res.data;
};

export const restoreUser = async (id: string): Promise<void> => {
    await Api.post(`users/${id}/restore`);
};

export const forceDeleteUser = async (id: string): Promise<void> => {
    await Api.delete(`users/${id}/force`);
};

// ───── User Invitations ─────

export const sendInvitation = async (data: { email: string; role: string; org_id?: string }): Promise<any> => {
    const res = await Api.post("invitations", data);
    return res.data?.data ?? res.data;
};

export const validateInvitation = async (token: string): Promise<any> => {
    const res = await Api.get(`invitations/validate/${token}`);
    return res.data?.data ?? res.data;
};
