import { Home } from 'lucide-react';
import { propertyNav } from './features/properties/nav';
import { floorNav } from './features/floors/nav';
import { roomNav } from './features/rooms/nav';
import { billingNav } from './features/billing/nav';
import { templatesNav } from './features/templates/nav';
import { ticketsNav } from './features/tickets/nav';
import type { NavItem } from './types/nav';

export const getPropertyNavItems = (propertyId: string, dashboardHomePath: string): NavItem[] => [
  { id: 'home', icon: Home, label: 'Trang chủ', path: dashboardHomePath, exact: true },
  propertyNav(propertyId),
  floorNav(propertyId),
  roomNav(propertyId),
  billingNav(propertyId),
  templatesNav(propertyId),
  ticketsNav(propertyId),
];
