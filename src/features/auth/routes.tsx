import { RouteObject } from 'react-router-dom';
import Auth from '../../pages/Auth';
import { FeatureRoutes } from '../common/routes';

const authRoutes: RouteObject[] = [
  {
    path: "auth",
    element: <Auth />
  }
];

export const authFeature: FeatureRoutes = {
  id: 'auth',
  routes: authRoutes,
  // No nav items as auth is not in the main navigation
};