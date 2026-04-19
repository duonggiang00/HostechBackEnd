import type { RouteObject } from 'react-router-dom';
import { propertyRoutes } from './property.routes';
import { roomRoutes } from '../../rooms/routes';

// Combine all property-related routes
// Note: building-overview currently uses defaultTab logic in propertyRoutes
export const combinedPropertyRoutes: RouteObject[] = [
  ...propertyRoutes,
  ...roomRoutes,
];
