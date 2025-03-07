import { RouteObject } from 'react-router-dom';
import FindContactsPage from '../../pages/FindContacts';
import { FeatureRoutes } from '../common/routes';

const contactFindingRoutes: RouteObject[] = [
  {
    path: "find-contacts",
    element: <FindContactsPage />
  }
];

export const contactFindingFeature: FeatureRoutes = {
  id: 'contactFinding',
  routes: contactFindingRoutes,
  navItems: [
    {
      path: '/find-contacts',
      label: 'Find Contacts',
      order: 40
    }
  ]
};