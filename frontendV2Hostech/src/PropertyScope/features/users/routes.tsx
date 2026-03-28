import type { RouteObject } from 'react-router-dom';
import PropertyUsersPage from './pages/PropertyUsersPage';
import CreateUserPage from './pages/CreateUserPage';
import UserDetailPage from './pages/UserDetailPage';

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
