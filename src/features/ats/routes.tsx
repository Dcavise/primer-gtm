import { RouteObject } from 'react-router-dom';
import ATSTracker from '../../pages/ATSTracker';
import { FeatureRoutes } from '../common/routes';

const atsRoutes: RouteObject[] = [
  {
    path: "ats-tracker",
    element: <ATSTracker />
  }
];

export const atsFeature: FeatureRoutes = {
  id: 'ats',
  routes: atsRoutes,
  navItems: [
    {
      path: '/ats-tracker',
      label: 'Applicant Tracking',
      order: 40
    }
  ]
};
