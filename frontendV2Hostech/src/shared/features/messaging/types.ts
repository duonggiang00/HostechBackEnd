export interface HandoverItem {
  id?: string;
  name: string;
  condition: 'good' | 'fair' | 'poor' | 'broken';
  notes: string | null;
}

export interface HandoverSnapshot {
  id?: string;
  meter_id?: string;
  meter_type?: string; 
  reading_value: number | string;
  reading_date?: string;
  unit?: string;
}

export interface Handover {
  id: string;
  contract_id: string;
  type: 'check_in' | 'check_out';
  status: 'draft' | 'confirmed';
  handover_date: string;
  notes: string | null;
  items?: HandoverItem[];
  snapshots?: HandoverSnapshot[];
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file';
  attachments?: { name: string; url: string; size: string }[];
}

export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastTimestamp?: string;
  unreadCount: number;
  online?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'message' | 'announcement' | 'alert' | 'update';
  unread: boolean;
  /** Backend notification `data.type` (e.g. 'ticket.created', 'contract.signed') */
  source_type?: string;
  /** Deep-link URL for navigating on click */
  action_url?: string;
  /** ISO string when marked read; null = unread */
  read_at?: string | null;
  /** Original backend `data` payload for extended rendering */
  raw?: Record<string, unknown>;
}
