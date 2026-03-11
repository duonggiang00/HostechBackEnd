import Api from "./Api";

// ───── Handovers ─────

export const getHandovers = async (): Promise<any[]> => {
    const res = await Api.get("handovers");
    return res.data?.data ?? res.data;
};

export const getHandoverById = async (id: string): Promise<any> => {
    const res = await Api.get(`handovers/${id}`);
    return res.data?.data ?? res.data;
};

export const createHandover = async (data: any): Promise<any> => {
    const res = await Api.post("handovers", data);
    return res.data?.data ?? res.data;
};

export const updateHandover = async (id: string, data: any): Promise<any> => {
    const res = await Api.put(`handovers/${id}`, data);
    return res.data?.data ?? res.data;
};

export const deleteHandover = async (id: string): Promise<void> => {
    await Api.delete(`handovers/${id}`);
};

export const confirmHandover = async (id: string): Promise<any> => {
    const res = await Api.post(`handovers/${id}/confirm`);
    return res.data?.data ?? res.data;
};

// ───── Handover Items ─────

export const getHandoverItems = async (handoverId: string): Promise<any[]> => {
    const res = await Api.get(`handovers/${handoverId}/items`);
    return res.data?.data ?? res.data;
};

export const createHandoverItem = async (handoverId: string, data: any): Promise<any> => {
    const res = await Api.post(`handovers/${handoverId}/items`, data);
    return res.data?.data ?? res.data;
};

export const updateHandoverItem = async (handoverId: string, itemId: string, data: any): Promise<any> => {
    const res = await Api.put(`handovers/${handoverId}/items/${itemId}`, data);
    return res.data?.data ?? res.data;
};

export const deleteHandoverItem = async (handoverId: string, itemId: string): Promise<void> => {
    await Api.delete(`handovers/${handoverId}/items/${itemId}`);
};

// ───── Handover Meter Snapshots ─────

export const getHandoverSnapshots = async (handoverId: string): Promise<any[]> => {
    const res = await Api.get(`handovers/${handoverId}/snapshots`);
    return res.data?.data ?? res.data;
};

export const createHandoverSnapshot = async (handoverId: string, data: any): Promise<any> => {
    const res = await Api.post(`handovers/${handoverId}/snapshots`, data);
    return res.data?.data ?? res.data;
};

export const deleteHandoverSnapshot = async (handoverId: string, snapshotId: string): Promise<void> => {
    await Api.delete(`handovers/${handoverId}/snapshots/${snapshotId}`);
};
