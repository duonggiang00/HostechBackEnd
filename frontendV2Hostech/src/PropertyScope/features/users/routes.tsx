import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

const PropertyUserDirectoryPage = lazy(() => import('./pages/PropertyUserDirectoryPage'));
const CreateUserPage = lazy(() => import('./pages/CreateUserPage'));
const UserDetailPage = lazy(() => import('./pages/UserDetailPage'));

export const usersRoutes: RouteObject[] = [
  {
    path: 'tenants',
    element: <PropertyUserDirectoryPage />,
  },
  {
    path: 'staff',
    element: <PropertyUserDirectoryPage />,
  },
  {
    path: 'users/create',
    element: <CreateUserPage />,
  },
  {
    path: 'users/:userId',
    element: <UserDetailPage />,
  },
  {
    path: 'users',
    element: <Navigate to="tenants" replace />,
  },
];
