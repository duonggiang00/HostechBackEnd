import Api from "../../../Api/Api";
import type { Service, ServiceFormValues } from "../../../Types/ServiceTypes";

// Lấy danh sách dịch vụ
export const getServices = async (): Promise<Service[]> => {
    const res = await Api.get("services");
    // Backend trả về { data: Service[] } (paginated) hoặc Service[] tùy cấu hình
    return res.data?.data ?? res.data;
};

// Tạo dịch vụ mới
export const createService = async (data: ServiceFormValues): Promise<Service> => {
    const res = await Api.post("services", data);
    return res.data?.data ?? res.data;
};

// Cập nhật dịch vụ
export const updateService = async (id: string, data: ServiceFormValues): Promise<Service> => {
    const res = await Api.put(`services/${id}`, data);
    return res.data?.data ?? res.data;
};

// Xóa mềm dịch vụ
export const deleteService = async (id: string): Promise<void> => {
    await Api.delete(`services/${id}`);
};

// Khôi phục dịch vụ đã xóa
export const restoreService = async (id: string): Promise<void> => {
    await Api.post(`services/${id}/restore`);
};

// Xóa vĩnh viễn
export const forceDeleteService = async (id: string): Promise<void> => {
    await Api.delete(`services/${id}/force`);
};

// Lấy danh sách dịch vụ đã xóa (trash)
export const getDeletedServices = async (): Promise<Service[]> => {
    const res = await Api.get("services/trash");
    return res.data?.data ?? res.data;
};
