import type { RouteConfig } from '../../shared/types/navigation';
import { ProfilePage } from './pages/ProfilePage';

export const profileRoutes: RouteConfig = {
  path: 'profile',
  Component: ProfilePage,
};
