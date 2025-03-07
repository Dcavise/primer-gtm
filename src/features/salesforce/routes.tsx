import { RouteObject } from 'react-router-dom';
import PLHiring from '../../pages/PLHiring';
import { FeatureRoutes } from '../common/routes';

const salesforceRoutes: RouteObject[] = [
  {
    path: "pl-hiring",
    element: <PLHiring />
  }
];

export const salesforceFeature: FeatureRoutes = {
  id: 'salesforce',
  routes: salesforceRoutes,
  navItems: [
    {
      path: '/pl-hiring',
      label: 'PL Hiring',
      order: 30
    }
  ]
};