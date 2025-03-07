import { RouteObject } from 'react-router-dom';
import { FeatureRoutes } from '../common/routes';

// Empty routes array since PL Hiring was removed
const salesforceRoutes: RouteObject[] = [];

export const salesforceFeature: FeatureRoutes = {
  id: 'salesforce',
  routes: salesforceRoutes,
  navItems: [] // Removed PL Hiring navigation item
};