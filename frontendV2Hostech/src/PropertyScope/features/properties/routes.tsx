import type { RouteObject } from 'react-router-dom';
import { useParams } from 'react-router-dom';

import PropertyDetailPage from './pages/PropertyDetailPage';
import BuildingOverviewPage from '../building-overview/pages/BuildingOverviewPage';
import RoomListPage from '../rooms/pages/RoomListPage';

// Templates feature components
import { PropertyInfoView } from './templates/components/PropertyInfoView';
import { RoomTemplateList } from './templates/components/RoomTemplateList';
import RoomTemplateDetailPage from './templates/pages/RoomTemplateDetailPage';

function PropertyInfoViewWrapper() {
  const { propertyId } = useParams<{ propertyId: string }>();
  return <PropertyInfoView propertyId={propertyId ?? ''} />;
}

function RoomTemplateListWrapper() {
  const { propertyId } = useParams<{ propertyId: string }>();
  return <RoomTemplateList propertyId={propertyId ?? ''} />;
}

export const propertyRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <PropertyDetailPage />,
  },
  {
    path: 'building-view',
    element: <BuildingOverviewPage />,
  },
  {
    path: 'rooms',
    element: <RoomListPage />,
  },
  // Integrated Template Routes
  {
    path: 'building-info',
    element: (
      <div className="animate-in fade-in duration-500">
        <PropertyInfoViewWrapper />
      </div>
    ),
  },
  {
    path: 'room-templates',
    element: (
      <div className="animate-in fade-in duration-500">
        <RoomTemplateListWrapper />
      </div>
    ),
  },
  {
    path: 'room-templates/:templateId',
    element: <RoomTemplateDetailPage />,
  },
];
