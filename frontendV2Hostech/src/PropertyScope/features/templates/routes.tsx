import type { RouteObject } from 'react-router-dom';
import { TemplatesPage } from './pages/TemplatesPage';

export const templatesRoutes: RouteObject[] = [
  {
    path: 'settings/templates',
    element: <TemplatesPage />,
  },
];
