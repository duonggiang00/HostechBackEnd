import { Ticket } from 'lucide-react';
import type { NavItem } from '../../types/nav';

export const ticketsNav = (propertyId: string): NavItem => ({
  id: 'tickets',
  icon: Ticket,
  label: 'Sự cố',
  path: `/properties/${propertyId}/tickets`,
});
