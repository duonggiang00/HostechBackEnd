import Api from "../../../Api/Api";

// ───── Organizations ─────

export const getOrgs = async (): Promise<any[]> => {
    const res = await Api.get("orgs");
    return res.data?.data ?? res.data;
};

export const getOrgById = async (id: string): Promise<any> => {
    const res = await Api.get(`orgs/${id}`);
    return res.data?.data ?? res.data;
};

export const createOrg = async (data: any): Promise<any> => {
    const res = await Api.post("orgs", data);
    return res.data?.data ?? res.data;
};

export const updateOrg = async (id: string, data: any): Promise<any> => {
    const res = await Api.put(`orgs/${id}`, data);
    return res.data?.data ?? res.data;
};

export const deleteOrg = async (id: string): Promise<void> => {
    await Api.delete(`orgs/${id}`);
};

export const getDeletedOrgs = async (): Promise<any[]> => {
    const res = await Api.get("orgs/trash");
    return res.data?.data ?? res.data;
};

export const restoreOrg = async (id: string): Promise<void> => {
    await Api.post(`orgs/${id}/restore`);
};

export const forceDeleteOrg = async (id: string): Promise<void> => {
    await Api.delete(`orgs/${id}/force`);
};

// Lấy danh sách properties thuộc org
export const getOrgProperties = async (orgId: string): Promise<any[]> => {
    const res = await Api.get(`orgs/${orgId}/properties`);
    return res.data?.data ?? res.data;
};

// Lấy danh sách users thuộc org
export const getOrgUsers = async (orgId: string): Promise<any[]> => {
    const res = await Api.get(`orgs/${orgId}/users`);
    return res.data?.data ?? res.data;
};

// Lấy danh sách services thuộc org
export const getOrgServices = async (orgId: string): Promise<any[]> => {
    const res = await Api.get(`orgs/${orgId}/services`);
    return res.data?.data ?? res.data;
};
