import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const PropertyUsersPage = lazy(() => import('./pages/PropertyUsersPage'));
const CreateUserPage = lazy(() => import('./pages/CreateUserPage'));
const UserDetailPage = lazy(() => import('./pages/UserDetailPage'));

export const usersRoutes: RouteObject[] = [
  {
    path: 'users',
    element: <PropertyUsersPage />,
  },
  {
    path: 'users/create',
    element: <CreateUserPage />,
  },
  {
    path: 'users/:userId',
    element: <UserDetailPage />,
  },
];
