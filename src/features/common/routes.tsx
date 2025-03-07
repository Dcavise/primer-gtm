import { RouteObject } from 'react-router-dom';
import NotFound from '../../pages/NotFound';

export interface FeatureRoutes {
  id: string;
  routes: RouteObject[];
  navItems?: {
    path: string;
    label: string;
    icon?: string;
    order?: number;
  }[];
}

export const commonRoutes: RouteObject[] = [
  {
    path: '*',
    element: <NotFound />
  }
];