import axiosClient from "../../../shared/api/axiosClient";
import type { Organization, OrgCreatePayload, OrgUpdatePayload } from "../types";

export const getOrgs = async (): Promise<Organization[]> => {
    const res = await axiosClient.get("orgs");
    return res.data?.data ?? res.data;
};

export const getOrgDetail = async (id: string): Promise<Organization> => {
    const res = await axiosClient.get(`orgs/${id}`);
    return res.data?.data ?? res.data;
};

export const createOrg = async (data: OrgCreatePayload): Promise<Organization> => {
    const res = await axiosClient.post("orgs", data);
    return res.data?.data ?? res.data;
};

export const updateOrg = async (id: string, data: OrgUpdatePayload): Promise<Organization> => {
    const res = await axiosClient.put(`orgs/${id}`, data);
    return res.data?.data ?? res.data;
};
