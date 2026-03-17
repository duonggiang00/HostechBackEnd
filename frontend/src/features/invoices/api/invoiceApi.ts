import Api from "../../../Api/Api";
import type { Invoice, InvoiceFormValues, InvoiceItem, InvoiceItemFormValues } from "../../../Types/InvoiceTypes";

export interface InvoiceFilters {
    status?: string;
    property_id?: string;
    contract_id?: string;
    sort?: string;
    include?: string;
    per_page?: number;
    page?: number;
}

// Lấy danh sách hóa đơn với filter & sort
export const getInvoices = async (filters?: InvoiceFilters): Promise<{ data: Invoice[]; meta?: any }> => {
    const params: Record<string, any> = {};
    if (filters?.status) params["filter[status]"] = filters.status;
    if (filters?.property_id) params["filter[property_id]"] = filters.property_id;
    if (filters?.contract_id) params["filter[contract_id]"] = filters.contract_id;
    if (filters?.sort) params["sort"] = filters.sort;
    if (filters?.include) params["include"] = filters.include;
    if (filters?.per_page) params["per_page"] = filters.per_page;
    if (filters?.page) params["page"] = filters.page;
    const res = await Api.get("invoices", { params });
    return res.data;
};

// Lấy danh sách hóa đơn đã xóa mềm (trash)
export const getDeletedInvoices = async (): Promise<Invoice[]> => {
    const res = await Api.get("invoices/trash");
    return res.data?.data ?? res.data;
};

// Lấy chi tiết hóa đơn theo ID
export const getInvoiceById = async (id: string): Promise<Invoice> => {
    const res = await Api.get(`invoices/${id}`);
    return res.data?.data ?? res.data;
};

// Tạo hóa đơn mới
export const createInvoice = async (data: InvoiceFormValues): Promise<Invoice> => {
    const res = await Api.post("invoices", data);
    return res.data?.data ?? res.data;
};

// Cập nhật hóa đơn
export const updateInvoice = async (id: string, data: InvoiceFormValues): Promise<Invoice> => {
    const res = await Api.put(`invoices/${id}`, data);
    return res.data?.data ?? res.data;
};

// Xóa mềm hóa đơn
export const deleteInvoice = async (id: string): Promise<void> => {
    await Api.delete(`invoices/${id}`);
};

// Khôi phục hóa đơn đã xóa
export const restoreInvoice = async (id: string): Promise<void> => {
    await Api.post(`invoices/${id}/restore`);
};

// Xóa vĩnh viễn hóa đơn
export const hardDeleteInvoice = async (id: string): Promise<void> => {
    await Api.delete(`invoices/${id}/force`);
};

// Phát hành hóa đơn
export const issueInvoice = async (id: string): Promise<Invoice> => {
    const res = await Api.put(`invoices/${id}/issue`);
    return res.data?.data ?? res.data;
};

// Xác nhận thanh toán hóa đơn
export const payInvoice = async (id: string, data?: any): Promise<Invoice> => {
    const res = await Api.put(`invoices/${id}/pay`, data);
    return res.data?.data ?? res.data;
};

// Hủy hóa đơn
export const cancelInvoice = async (id: string): Promise<Invoice> => {
    const res = await Api.put(`invoices/${id}/cancel`);
    return res.data?.data ?? res.data;
};

// Thêm dòng chi phí vào hóa đơn
export const addInvoiceItem = async (invoiceId: string, data: InvoiceItemFormValues): Promise<InvoiceItem> => {
    const res = await Api.post(`invoices/${invoiceId}/items`, data);
    return res.data?.data ?? res.data;
};

// Xóa dòng chi phí khỏi hóa đơn
export const removeInvoiceItem = async (_invoiceId: string, itemId: string): Promise<void> => {
    await Api.delete(`invoices/items/${itemId}`);
};

// Lấy hóa đơn theo tòa nhà
export const getInvoicesByProperty = async (propertyId: string): Promise<Invoice[]> => {
    const res = await Api.get(`properties/${propertyId}/invoices`);
    return res.data?.data ?? res.data;
};
