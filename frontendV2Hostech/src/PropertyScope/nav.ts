import { Home } from 'lucide-react';
import { roomNav } from './features/rooms/nav';
import { billingNav } from './features/billing/nav';
import { templatesNav } from './features/templates/nav';
import { ticketsNav } from './features/tickets/nav';
import { buildingOverviewNav } from './features/building-overview/nav';
import type { NavItem } from './types/nav';

export const getPropertyNavItems = (propertyId: string, dashboardHomePath: string): NavItem[] => [
  { id: 'home', icon: Home, label: 'Trang chủ', path: dashboardHomePath, exact: true },
  buildingOverviewNav(propertyId),
  roomNav(propertyId),
  ...templatesNav(propertyId),
  billingNav(propertyId),
  ticketsNav(propertyId),
];
