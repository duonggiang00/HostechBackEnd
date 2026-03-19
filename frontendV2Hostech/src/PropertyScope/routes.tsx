import { Routes, Route, Navigate } from 'react-router-dom';
import { dashboardRoutes } from './features/dashboard/routes';
import { propertyRoutes } from './features/properties/routes';
import { floorRoutes } from './features/floors/routes';
import { roomRoutes } from './features/rooms/routes';

export default function PropertyScopeRoutes() {
  return (
    <Routes>
      {/* Feature Routes */}
      {dashboardRoutes}
      {propertyRoutes}
      {floorRoutes}
      {roomRoutes}
      
      {/* Default redirect for this scope */}
      <Route index element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
