import { CreditCard } from 'lucide-react';
import type { NavItem } from '../../types/nav';

export const billingNav = (propertyId: string): NavItem => ({
  id: 'billing',
  icon: CreditCard,
  label: 'Hóa đơn',
  path: `/property/${propertyId}/billing`,
});
