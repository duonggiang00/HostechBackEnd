import Api from "../../../Api/Api";

// ───── Meters ─────

export const getMeters = async (): Promise<any[]> => {
    const res = await Api.get("meters");
    return res.data?.data ?? res.data;
};

export const getMetersByProperty = async (propertyId: string): Promise<any[]> => {
    const res = await Api.get(`properties/${propertyId}/meters`);
    return res.data?.data ?? res.data;
};

export const getMetersByFloor = async (propertyId: string, floorId: string): Promise<any[]> => {
    const res = await Api.get(`properties/${propertyId}/floors/${floorId}/meters`);
    return res.data?.data ?? res.data;
};

export const getMeterById = async (id: string): Promise<any> => {
    const res = await Api.get(`meters/${id}`);
    return res.data?.data ?? res.data;
};

export const createMeter = async (data: any): Promise<any> => {
    const res = await Api.post("meters", data);
    return res.data?.data ?? res.data;
};

export const updateMeter = async (id: string, data: any): Promise<any> => {
    const res = await Api.put(`meters/${id}`, data);
    return res.data?.data ?? res.data;
};

export const deleteMeter = async (id: string): Promise<void> => {
    await Api.delete(`meters/${id}`);
};

// ───── Meter Readings ─────

export const getMeterReadings = async (meterId: string): Promise<any[]> => {
    const res = await Api.get(`meters/${meterId}/readings`);
    return res.data?.data ?? res.data;
};

export const getMeterReadingById = async (meterId: string, readingId: string): Promise<any> => {
    const res = await Api.get(`meters/${meterId}/readings/${readingId}`);
    return res.data?.data ?? res.data;
};

export const createMeterReading = async (meterId: string, data: any): Promise<any> => {
    const res = await Api.post(`meters/${meterId}/readings`, data);
    return res.data?.data ?? res.data;
};

export const updateMeterReading = async (meterId: string, readingId: string, data: any): Promise<any> => {
    const res = await Api.put(`meters/${meterId}/readings/${readingId}`, data);
    return res.data?.data ?? res.data;
};

export const deleteMeterReading = async (meterId: string, readingId: string): Promise<void> => {
    await Api.delete(`meters/${meterId}/readings/${readingId}`);
};

// ───── Adjustment Notes (Điều chỉnh chỉ số đồng hồ) ─────

export const getAdjustments = async (readingId: string): Promise<any[]> => {
    const res = await Api.get(`meter-readings/${readingId}/adjustments`);
    return res.data?.data ?? res.data;
};

export const createAdjustment = async (readingId: string, data: any): Promise<any> => {
    const res = await Api.post(`meter-readings/${readingId}/adjustments`, data);
    return res.data?.data ?? res.data;
};

export const approveAdjustment = async (readingId: string, adjustmentId: string): Promise<any> => {
    const res = await Api.put(`meter-readings/${readingId}/adjustments/${adjustmentId}/approve`, {});
    return res.data?.data ?? res.data;
};

export const rejectAdjustment = async (readingId: string, adjustmentId: string): Promise<any> => {
    const res = await Api.put(`meter-readings/${readingId}/adjustments/${adjustmentId}/reject`, {});
    return res.data?.data ?? res.data;
};
