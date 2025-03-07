import { RouteObject } from 'react-router-dom';
import CRMPipeline from '../../pages/CRMPipeline';
import { FeatureRoutes } from '../common/routes';

const crmRoutes: RouteObject[] = [
  {
    path: "crm-pipeline",
    element: <CRMPipeline />
  }
];

export const crmFeature: FeatureRoutes = {
  id: 'crm',
  routes: crmRoutes,
  navItems: [
    {
      path: '/crm-pipeline',
      label: 'CRM Pipeline',
      order: 30
    }
  ]
};
