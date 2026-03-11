import Api from "../../../Api/Api";
import type { Contract, ContractFormValues } from "../../../Types/ContractTypes";

// Lấy danh sách hợp đồng (active)
export const getContracts = async (): Promise<Contract[]> => {
    const res = await Api.get("contracts");
    return res.data?.data ?? res.data;
};

// Lấy danh sách hợp đồng đã xóa mềm (trash)
export const getDeletedContracts = async (): Promise<Contract[]> => {
    const res = await Api.get("contracts/trash");
    return res.data?.data ?? res.data;
};

// Lấy chi tiết hợp đồng theo ID
export const getContractById = async (id: string): Promise<Contract> => {
    const res = await Api.get(`contracts/${id}`);
    return res.data?.data ?? res.data;
};

// Tạo hợp đồng mới
export const createContract = async (data: ContractFormValues): Promise<Contract> => {
    const res = await Api.post("contracts", data);
    return res.data?.data ?? res.data;
};

// Cập nhật hợp đồng
export const updateContract = async (id: string, data: ContractFormValues): Promise<Contract> => {
    const res = await Api.put(`contracts/${id}`, data);
    return res.data?.data ?? res.data;
};

// Xóa mềm hợp đồng
export const deleteContract = async (id: string): Promise<void> => {
    await Api.delete(`contracts/${id}`);
};

// Khôi phục hợp đồng đã xóa
export const restoreContract = async (id: string): Promise<void> => {
    await Api.post(`contracts/${id}/restore`);
};

// Xóa vĩnh viễn hợp đồng
export const hardDeleteContract = async (id: string): Promise<void> => {
    await Api.delete(`contracts/${id}/force`);
};

// Lấy danh sách phòng còn trống của hợp đồng
export const getContractAvailableRooms = async (contractId: string): Promise<any[]> => {
    const res = await Api.get(`contracts/${contractId}/available-rooms`);
    return res.data?.data ?? res.data;
};

// Thêm thành viên vào hợp đồng
export const addContractMember = async (contractId: string, data: any): Promise<void> => {
    await Api.post(`contracts/${contractId}/members`, data);
};

// Lấy danh sách hợp đồng chờ ký của người dùng hiện tại
export const getMyPendingContracts = async (): Promise<Contract[]> => {
    const res = await Api.get("contracts/my-pending");
    return res.data?.data ?? res.data;
};
