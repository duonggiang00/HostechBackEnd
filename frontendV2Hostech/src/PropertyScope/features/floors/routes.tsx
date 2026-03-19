import { Route } from 'react-router-dom';
import FloorsPage from './pages/FloorsPage';
import FloorPlanPage from './pages/FloorPlanPage';

export const floorRoutes = (
  <>
    <Route path="floors" element={<FloorsPage />} />
    <Route path="floors/:floorId" element={<FloorPlanPage />} />
  </>
);
