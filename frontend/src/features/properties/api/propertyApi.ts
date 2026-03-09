import Api from "../../../Api/Api";
import type { PropertyDTO, FloorDTO, RoomDTO, PaginatedResponse } from "../types";

// ───── Properties ─────

export const getProperties = async (search?: string, page: number = 1, per_page: number = 10): Promise<PaginatedResponse<PropertyDTO>> => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", page.toString());
    params.set("per_page", per_page.toString());
    params.set("include", "floors,rooms"); // Include nested data to display correct scale (floors/rooms count)
    const res = await Api.get(`properties?${params}`);
    return res.data;
};


export const getPropertyById = async (id: string): Promise<PropertyDTO> => {
    const res = await Api.get(`properties/${id}`);
    return res.data?.data ?? res.data;
};

export const createProperty = async (data: any): Promise<PropertyDTO> => {
    const res = await Api.post("properties", data);
    return res.data?.data ?? res.data;
};

export const updateProperty = async (id: string, data: any): Promise<PropertyDTO> => {
    const res = await Api.put(`properties/${id}`, data);
    return res.data?.data ?? res.data;
};

export const deleteProperty = async (id: string): Promise<void> => {
    await Api.delete(`properties/${id}`);
};

export const getDeletedProperties = async (): Promise<PropertyDTO[]> => {
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

export const getFloors = async (params: Record<string, any> = {}): Promise<FloorDTO[]> => {
    const res = await Api.get("floors", { params });
    return res.data?.data ?? res.data;
};

export const getFloorsByProperty = async (propertyId: string): Promise<FloorDTO[]> => {
    const res = await Api.get(`properties/${propertyId}/floors`);
    return res.data?.data ?? res.data;
};

export const getFloorById = async (id: string): Promise<FloorDTO> => {
    const res = await Api.get(`floors/${id}`);
    return res.data?.data ?? res.data;
};

export const createFloor = async (propertyId: string, data: any): Promise<FloorDTO> => {
    const res = await Api.post(`properties/${propertyId}/floors`, data);
    return res.data?.data ?? res.data;
};

export const updateFloor = async (id: string, data: any): Promise<FloorDTO> => {
    const res = await Api.put(`floors/${id}`, data);
    return res.data?.data ?? res.data;
};

export const deleteFloor = async (id: string): Promise<void> => {
    await Api.delete(`floors/${id}`);
};

export const getDeletedFloors = async (): Promise<FloorDTO[]> => {
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

export const getRooms = async (params: Record<string, any> = {}): Promise<RoomDTO[]> => {
    const res = await Api.get("rooms", { params: { include: "floor,property", ...params } });
    return res.data?.data ?? res.data;
};

export const getRoomsByProperty = async (propertyId: string): Promise<RoomDTO[]> => {
    const res = await Api.get(`properties/${propertyId}/rooms?include=floor`);
    return res.data?.data ?? res.data;
};

export const getRoomById = async (id: string): Promise<RoomDTO> => {
    const res = await Api.get(`rooms/${id}`);
    return res.data?.data ?? res.data;
};

export const createRoom = async (propertyId: string, data: any): Promise<RoomDTO> => {
    const res = await Api.post(`properties/${propertyId}/rooms`, data);
    return res.data?.data ?? res.data;
};

export const updateRoom = async (id: string, data: any): Promise<RoomDTO> => {
    const res = await Api.put(`rooms/${id}`, data);
    return res.data?.data ?? res.data;
};

export const deleteRoom = async (id: string): Promise<void> => {
    await Api.delete(`rooms/${id}`);
};

export const getDeletedRooms = async (): Promise<RoomDTO[]> => {
    const res = await Api.get("rooms/trash");
    return res.data?.data ?? res.data;
};

export const restoreRoom = async (id: string): Promise<void> => {
    await Api.post(`rooms/${id}/restore`);
};

export const forceDeleteRoom = async (id: string): Promise<void> => {
    await Api.delete(`rooms/${id}/force`);
};

