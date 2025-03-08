import { RouteObject } from 'react-router-dom';
import { FeatureRoutes } from '../common/routes';

// Auth has been removed - empty routes array
const authRoutes: RouteObject[] = [];

// Maintain the feature structure but with no routes
export const authFeature: FeatureRoutes = {
  id: 'auth',
  routes: authRoutes,
  // No nav items as auth is not used anymore
};