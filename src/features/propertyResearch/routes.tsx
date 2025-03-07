import { RouteObject } from 'react-router-dom';
import PropertyResearch from '../../pages/PropertyResearch';
import { FeatureRoutes } from '../common/routes';

const propertyResearchRoutes: RouteObject[] = [
  {
    path: "property-research",
    element: <PropertyResearch />
  }
];

export const propertyResearchFeature: FeatureRoutes = {
  id: 'propertyResearch',
  routes: propertyResearchRoutes,
  navItems: [
    {
      path: '/property-research',
      label: 'Property Research',
      order: 10
    }
  ]
};