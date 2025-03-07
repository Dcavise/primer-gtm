import { RouteObject } from 'react-router-dom';
import AdmissionsAnalytics from '../../pages/AdmissionsAnalytics';
import { FeatureRoutes } from '../common/routes';

const admissionsAnalyticsRoutes: RouteObject[] = [
  {
    path: "admissions-analytics",
    element: <AdmissionsAnalytics />
  }
];

export const admissionsAnalyticsFeature: FeatureRoutes = {
  id: 'admissionsAnalytics',
  routes: admissionsAnalyticsRoutes,
  navItems: [
    {
      path: '/admissions-analytics',
      label: 'Admissions Analytics',
      order: 50
    }
  ]
};
