import type { RouteObject } from 'react-router-dom';
import { Navigate, useParams } from 'react-router-dom';
import { TemplatesPage } from './pages/TemplatesPage';
import { PropertyInfoView } from './components/PropertyInfoView';
import { RoomTemplateList } from './components/RoomTemplateList';

function PropertyInfoViewWrapper() {
  const { propertyId } = useParams<{ propertyId: string }>();
  return <PropertyInfoView propertyId={propertyId ?? ''} />;
}

function RoomTemplateListWrapper() {
  const { propertyId } = useParams<{ propertyId: string }>();
  return <RoomTemplateList propertyId={propertyId ?? ''} />;
}

export const templatesRoutes: RouteObject[] = [
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
];

