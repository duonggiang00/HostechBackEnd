import type { RouteObject } from 'react-router-dom';
import { Navigate, useParams } from 'react-router-dom';
import { TemplatesPage } from './pages/TemplatesPage';
import { PropertyInfoView } from './components/PropertyInfoView';
import { RoomTemplateList } from './components/RoomTemplateList';
import ServiceListPage from '../services/pages/ServiceListPage';

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
    path: 'templates',
    element: <TemplatesPage />,
    children: [
      {
        index: true,
        element: <Navigate to="info" replace />,
      },
      {
        path: 'info',
        element: <PropertyInfoViewWrapper />,
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

