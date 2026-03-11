export interface AuditLogType {
  id: number;
  description: string;
  event: string;
  subject_type: string;
  subject_id: number;
  causer_id: number | null;
  causer?: {
    id: number;
    name: string;
    full_name?: string;
  };
  properties: {
    attributes?: Record<string, any>;
    old?: Record<string, any>;
  };
  created_at: string;
}

export interface MediaUploadResponse {
  media_uuid: string;
  url: string;
}
