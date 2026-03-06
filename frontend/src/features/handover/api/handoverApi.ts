import axiosClient from "../../../shared/api/axiosClient";

// ───── Handovers ─────

export const getHandovers = async (): Promise<any[]> => {
    const res = await axiosClient.get("handovers");
    return res.data?.data ?? res.data;
};

export const getHandoverById = async (id: string): Promise<any> => {
    const res = await axiosClient.get(`handovers/${id}`);
    return res.data?.data ?? res.data;
};

export const createHandover = async (data: any): Promise<any> => {
    const res = await axiosClient.post("handovers", data);
    return res.data?.data ?? res.data;
};

export const updateHandover = async (id: string, data: any): Promise<any> => {
    const res = await axiosClient.put(`handovers/${id}`, data);
    return res.data?.data ?? res.data;
};

export const deleteHandover = async (id: string): Promise<void> => {
    await axiosClient.delete(`handovers/${id}`);
};

export const confirmHandover = async (id: string): Promise<any> => {
    const res = await axiosClient.post(`handovers/${id}/confirm`);
    return res.data?.data ?? res.data;
};

// ───── Handover Items ─────

export const getHandoverItems = async (handoverId: string): Promise<any[]> => {
    const res = await axiosClient.get(`handovers/${handoverId}/items`);
    return res.data?.data ?? res.data;
};

export const createHandoverItem = async (handoverId: string, data: any): Promise<any> => {
    const res = await axiosClient.post(`handovers/${handoverId}/items`, data);
    return res.data?.data ?? res.data;
};

export const updateHandoverItem = async (handoverId: string, itemId: string, data: any): Promise<any> => {
    const res = await axiosClient.put(`handovers/${handoverId}/items/${itemId}`, data);
    return res.data?.data ?? res.data;
};

export const deleteHandoverItem = async (handoverId: string, itemId: string): Promise<void> => {
    await axiosClient.delete(`handovers/${handoverId}/items/${itemId}`);
};

// ───── Handover Meter Snapshots ─────

export const getHandoverSnapshots = async (handoverId: string): Promise<any[]> => {
    const res = await axiosClient.get(`handovers/${handoverId}/snapshots`);
    return res.data?.data ?? res.data;
};

export const createHandoverSnapshot = async (handoverId: string, data: any): Promise<any> => {
    const res = await axiosClient.post(`handovers/${handoverId}/snapshots`, data);
    return res.data?.data ?? res.data;
};

export const deleteHandoverSnapshot = async (handoverId: string, snapshotId: string): Promise<void> => {
    await axiosClient.delete(`handovers/${handoverId}/snapshots/${snapshotId}`);
};
