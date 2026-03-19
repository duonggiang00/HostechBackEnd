export interface Ticket {
  id: string;
  property_id: string;
  room_id: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  due_at: string | null;
  created_at: string;
  room?: {
    name: string;
  } | null;
  property?: {
    name: string;
  } | null;
  assigned_to?: {
    name: string;
  } | null;
}
