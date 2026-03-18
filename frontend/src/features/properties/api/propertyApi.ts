import Api from "../../../Api/Api";
import type {
  PropertyDTO,
  FloorDTO,
  RoomDTO,
  PaginatedResponse,
} from "../types";

/**
 * Helper to build URLSearchParams for Spatie Query Builder
 */
const buildParams = (params: Record<string, any> = {}) => {
  const urlParams = new URLSearchParams();

  if (params.page) urlParams.set("page", params.page.toString());
  if (params.per_page) urlParams.set("per_page", params.per_page.toString());
  if (params.search) urlParams.set("search", params.search);
  if (params.include) urlParams.set("include", params.include);
  if (params.sort) urlParams.set("sort", params.sort);

  // Handle filters: filter[key]=value
  if (params.filter) {
    Object.entries(params.filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        urlParams.set(`filter[${key}]`, value as string);
      }
    });
  }

  return urlParams.toString();
};

// ───── Properties ─────

export const getProperties = async (
  params: any = {},
): Promise<PaginatedResponse<PropertyDTO>> => {
  const res = await Api.get(
    `properties?${buildParams({ include: "floors,rooms", ...params })}`,
  );
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

export const updateProperty = async (
  id: string,
  data: any,
): Promise<PropertyDTO> => {
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

// ───── Floors ─────

export const getFloors = async (
  params: any = {},
): Promise<PaginatedResponse<FloorDTO>> => {
  const res = await Api.get(`floors?${buildParams(params)}`);
  return res.data;
};

export const getFloorById = async (id: string): Promise<FloorDTO> => {
  const res = await Api.get(`floors/${id}`);
  return res.data?.data ?? res.data;
};

export const createFloor = (data: any) => {
  return Api.post("/floors", data);
};

export const updateFloor = async (id: string, data: any): Promise<FloorDTO> => {
  const res = await Api.put(`floors/${id}`, data);
  return res.data?.data ?? res.data;
};

export const deleteFloor = async (id: string): Promise<void> => {
  await Api.delete(`floors/${id}`);
};

export const restoreFloor = async (id: string): Promise<void> => {
  await Api.post(`floors/${id}/restore`);
};

export const forceDeleteFloor = async (id: string): Promise<void> => {
  await Api.delete(`floors/${id}/force`);
};

// ───── Rooms ─────

export const getRooms = async (
  params: any = {},
): Promise<PaginatedResponse<RoomDTO>> => {
  const res = await Api.get(
    `rooms?${buildParams({ include: "floor,property,media", ...params })}`,
  );
  return res.data;
};

export const getRoomById = async (id: string): Promise<RoomDTO> => {
  const res = await Api.get(`rooms/${id}?include=floor,property,media,assets`);
  return res.data?.data ?? res.data;
};

export const createRoom = async (data: any): Promise<RoomDTO> => {
  const res = await Api.post("rooms", data);
  return res.data?.data ?? res.data;
};

export const updateRoom = async (id: string, data: any): Promise<RoomDTO> => {
  const res = await Api.put(`rooms/${id}`, data);
  return res.data?.data ?? res.data;
};

export const deleteRoom = async (id: string): Promise<void> => {
  await Api.delete(`rooms/${id}`);
};

export const restoreRoom = async (id: string): Promise<void> => {
  await Api.post(`rooms/${id}/restore`);
};

export const forceDeleteRoom = async (id: string): Promise<void> => {
  await Api.delete(`rooms/${id}/force`);
};
