import Api from "../../../Api/Api";

// ───── Properties ─────

export const getProperties = async (search?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await Api.get(`properties?${params}`);
    return res.data?.data ?? res.data;
};

export const getPropertyById = async (id: string): Promise<any> => {
    const res = await Api.get(`properties/${id}`);
    return res.data?.data ?? res.data;
};

export const createProperty = async (data: any): Promise<any> => {
    const res = await Api.post("properties", data);
    return res.data?.data ?? res.data;
};

export const updateProperty = async (id: string, data: any): Promise<any> => {
    const res = await Api.put(`properties/${id}`, data);
    return res.data?.data ?? res.data;
};

export const deleteProperty = async (id: string): Promise<void> => {
    await Api.delete(`properties/${id}`);
};

export const getDeletedProperties = async (): Promise<any[]> => {
    const res = await Api.get("properties/trash");
    return res.data?.data ?? res.data;
};

export const restoreProperty = async (id: string): Promise<void> => {
    await Api.post(`properties/${id}/restore`);
};

export const forceDeleteProperty = async (id: string): Promise<void> => {
    await Api.delete(`properties/${id}/force`);
};

// ───── Floors (nested trong property) ─────

export const getFloors = async (search?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await Api.get(`floors?${params}`);
    return res.data?.data ?? res.data;
};

export const getFloorsByProperty = async (propertyId: string): Promise<any[]> => {
    const res = await Api.get(`properties/${propertyId}/floors`);
    return res.data?.data ?? res.data;
};

export const getFloorById = async (id: string): Promise<any> => {
    const res = await Api.get(`floors/${id}`);
    return res.data?.data ?? res.data;
};

export const createFloor = async (propertyId: string, data: any): Promise<any> => {
    const res = await Api.post(`properties/${propertyId}/floors`, data);
    return res.data?.data ?? res.data;
};

export const updateFloor = async (id: string, data: any): Promise<any> => {
    const res = await Api.put(`floors/${id}`, data);
    return res.data?.data ?? res.data;
};

export const deleteFloor = async (id: string): Promise<void> => {
    await Api.delete(`floors/${id}`);
};

export const getDeletedFloors = async (): Promise<any[]> => {
    const res = await Api.get("floors/trash");
    return res.data?.data ?? res.data;
};

export const restoreFloor = async (id: string): Promise<void> => {
    await Api.post(`floors/${id}/restore`);
};

export const forceDeleteFloor = async (id: string): Promise<void> => {
    await Api.delete(`floors/${id}/force`);
};

// ───── Rooms (nested trong property) ─────

export const getRooms = async (search?: string): Promise<any[]> => {
    const params = new URLSearchParams({ "include": "floor,property" });
    if (search) params.set("search", search);
    const res = await Api.get(`rooms?${params}`);
    return res.data?.data ?? res.data;
};

export const getRoomsByProperty = async (propertyId: string): Promise<any[]> => {
    const res = await Api.get(`properties/${propertyId}/rooms?include=floor`);
    return res.data?.data ?? res.data;
};

export const getRoomById = async (id: string): Promise<any> => {
    const res = await Api.get(`rooms/${id}`);
    return res.data?.data ?? res.data;
};

export const createRoom = async (propertyId: string, data: any): Promise<any> => {
    const res = await Api.post(`properties/${propertyId}/rooms`, data);
    return res.data?.data ?? res.data;
};

export const updateRoom = async (id: string, data: any): Promise<any> => {
    const res = await Api.put(`rooms/${id}`, data);
    return res.data?.data ?? res.data;
};

export const deleteRoom = async (id: string): Promise<void> => {
    await Api.delete(`rooms/${id}`);
};

export const getDeletedRooms = async (): Promise<any[]> => {
    const res = await Api.get("rooms/trash");
    return res.data?.data ?? res.data;
};

export const restoreRoom = async (id: string): Promise<void> => {
    await Api.post(`rooms/${id}/restore`);
};

export const forceDeleteRoom = async (id: string): Promise<void> => {
    await Api.delete(`rooms/${id}/force`);
};
