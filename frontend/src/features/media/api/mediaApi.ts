import axiosClient from "../../../shared/api/axiosClient";

/**
 * Upload file chung — dùng cho avatar, tài liệu hợp đồng, v.v.
 */
export const uploadMedia = async (file: File, context?: string): Promise<{ url: string; id: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    if (context) {
        formData.append("context", context);
    }
    const res = await axiosClient.post("media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
};
