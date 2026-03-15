import axiosClient from "../../../shared/api/axiosClient";
import type { Organization, OrgCreatePayload, OrgUpdatePayload } from "../types";

export const getOrgs = async (params: any = {}): Promise<Organization[]> => {
    const urlParams = new URLSearchParams();
    if (params.filter) {
        Object.entries(params.filter).forEach(([key, value]) => {
            if (value) urlParams.set(`filter[${key}]`, value as string);
        });
    }
    const res = await axiosClient.get(`orgs?${urlParams.toString()}`);
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
