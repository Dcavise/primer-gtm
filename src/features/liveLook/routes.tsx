import { RouteObject } from 'react-router-dom';
import LiveLook from '../../pages/LiveLook';
import { FeatureRoutes } from '../common/routes';

const liveLookRoutes: RouteObject[] = [
  {
    path: "live-look",
    element: <LiveLook />
  }
];

export const liveLookFeature: FeatureRoutes = {
  id: 'liveLook',
  routes: liveLookRoutes,
  navItems: [
    {
      path: '/live-look',
      label: 'Live Look',
      order: 50
    }
  ]
};