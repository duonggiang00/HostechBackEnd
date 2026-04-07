import type { RouteObject } from 'react-router-dom';
import { Navigate, useParams } from 'react-router-dom';
import { TemplatesPage } from './pages/TemplatesPage';
import { BuildingConfig } from './components/BuildingConfig';
import { RoomTemplateList } from './components/RoomTemplateList';
import ServiceListPage from '../services/pages/ServiceListPage';

function BuildingConfigWrapper() {
  const { propertyId } = useParams<{ propertyId: string }>();
  return <BuildingConfig propertyId={propertyId ?? ''} />;
}

function RoomTemplateListWrapper() {
  const { propertyId } = useParams<{ propertyId: string }>();
  return <RoomTemplateList propertyId={propertyId ?? ''} />;
}

export const templatesRoutes: RouteObject[] = [
  {
    path: 'templates',
    element: <TemplatesPage />,
    children: [
      {
        index: true,
        element: <Navigate to="building" replace />,
      },
      {
        path: 'building',
        element: <BuildingConfigWrapper />,
      },
      {
        path: 'services',
        element: <ServiceListPage hideHeader={true} />,
      },
      {
        path: 'rooms',
        element: <RoomTemplateListWrapper />,
      },
    ],
  },
];

