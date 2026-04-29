export interface UploadResponse {
  url: string;
  id: string;
  name: string;
  /** UUID của bản ghi `media` (API `data.media_id`) — dùng khi backend yêu cầu media UUID thay vì temporary_upload_id */
  mediaId?: string;
}
