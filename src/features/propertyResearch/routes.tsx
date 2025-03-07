import { RouteObject } from 'react-router-dom';
import PropertyResearch from '../../pages/PropertyResearch';
import { FeatureRoutes } from '../common/routes';

// Add debug logging
console.log('Loading PropertyResearch routes');

// In React Router v6, when routes are nested under a parent route, they should NOT include the leading slash
// The leading slash is only needed in the navItems for generating links
const propertyResearchRoutes: RouteObject[] = [
  {
    path: "property-research", // No leading slash for nested routes in React Router v6
    element: <PropertyResearch />
  }
];

// Log routes for debugging
console.log('PropertyResearch routes defined:', propertyResearchRoutes);

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

// Log feature definition for debugging
console.log('PropertyResearch feature defined:', propertyResearchFeature);