export interface RoomTemplate {
  id: string;
  property_id: string;
  name: string;
  room_type: string;
  base_price: number;
  area?: number;
  capacity?: number;
  description?: string;
  services?: any[];
  assets?: any[];
  created_at: string;
  updated_at: string;
}

export interface ContractTemplate {
  id: string;
  property_id: string;
  name: string;
  content: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceTemplate {
  id: string;
  property_id: string;
  name: string;
  type: string;
  unit_price: number;
  unit: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomTemplatePayload {
  name: string;
  room_type: string;
  base_price: number;
  area?: number;
  capacity?: number;
  description?: string;
  services?: string[];
  assets?: { name: string; condition: string; note: string }[];
}

export interface CreateServiceTemplatePayload {
  name: string;
  type: string;
  unit_price: number;
  unit: string;
  description?: string;
}

export interface CreateContractTemplatePayload {
  name: string;
  content: string;
  description?: string;
  is_default?: boolean;
}
