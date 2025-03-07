import { RouteObject } from 'react-router-dom';
import Index from '../../pages/Index';
import { FeatureRoutes } from './routes';

const indexRoute: RouteObject[] = [
  {
    index: true,
    element: <Index />
  }
];

export const indexFeature: FeatureRoutes = {
  id: 'index',
  routes: indexRoute,
  navItems: [
    {
      path: '/',
      label: 'Dashboard',
      order: 0
    }
  ]
};