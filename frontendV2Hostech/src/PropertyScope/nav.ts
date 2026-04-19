import { Home } from 'lucide-react';
import { roomNav } from './features/rooms/nav';
import { buildingOverviewNav } from './features/building-overview/nav';
import { propertySettingsNav } from './features/properties/nav';
import { billingNav } from './features/billing/nav';
import { ticketsNav } from './features/tickets/nav';
import type { NavItem } from './types/nav';

export const getPropertyNavItems = (propertyId: string, dashboardHomePath: string): NavItem[] => [
  { id: 'home', icon: Home, label: 'Trang chủ', path: dashboardHomePath, exact: true },
  buildingOverviewNav(propertyId),
  roomNav(propertyId),
  ...propertySettingsNav(propertyId),
  billingNav(propertyId),
  ticketsNav(propertyId),
];
