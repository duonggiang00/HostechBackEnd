import { Routes, Route, Navigate } from 'react-router-dom';
import { dashboardRoutes } from './features/dashboard/routes';
import { propertyRoutes } from './features/properties/routes';
import { floorRoutes } from './features/floors/routes';
import { roomRoutes } from './features/rooms/routes';
import { billingRoutes } from './features/billing/routes';
import { templatesRoutes } from './features/templates/routes';

export default function PropertyScopeRoutes() {
  const allRoutes = [
    ...dashboardRoutes,
    ...propertyRoutes,
    ...floorRoutes,
    ...roomRoutes,
    ...billingRoutes,
    ...templatesRoutes,
  ];

  return (
    <Routes>
      {/* Feature Routes */}
      {allRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      
      {/* Default redirect for this scope */}
      <Route index element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
