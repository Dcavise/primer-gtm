import { RouteObject } from 'react-router-dom';
import FindContactsPage from '../../pages/FindContacts';
import { FeatureRoutes } from '../common/routes';

const contactFindingRoutes: RouteObject[] = [
  {
    path: "contact-finding",
    element: <FindContactsPage />
  }
];

export const contactFindingFeature: FeatureRoutes = {
  id: 'contactFinding',
  routes: contactFindingRoutes,
  navItems: [
    {
      path: '/contact-finding',
      label: 'Contact Finding',
      order: 40
    }
  ]
};