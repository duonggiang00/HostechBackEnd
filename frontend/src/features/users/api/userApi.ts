import axiosClient from "../../../shared/api/axiosClient";
import type { UserType, UserFilters, InvitationPayload, PaginatedResponse } from "../types";

export const getUsers = async (params?: UserFilters): Promise<PaginatedResponse<UserType>> => {
    // clean up undefined params
    const cleanParams = Object.fromEntries(Object.entries(params || {}).filter(([_, v]) => v !== undefined));
    const res = await axiosClient.get("users", { params: cleanParams });
    return res.data;
};

export const updateUserStatus = async (id: string | number, data: { is_active: boolean }): Promise<UserType> => {
    const res = await axiosClient.put(`users/${id}`, data);
    return res.data?.data ?? res.data;
};

export const removeUserFromOrg = async (id: string | number): Promise<void> => {
    await axiosClient.delete(`users/${id}`);
};

export const sendInvitation = async (data: InvitationPayload): Promise<void> => {
    await axiosClient.post("invitations", data);
};
