import { FeatureRoutes } from './common/routes';
import { indexFeature } from './common/indexRoute';
import { authFeature } from './auth/routes';
import { realEstateFeature } from './realEstate/routes';
import { salesforceFeature } from './salesforce/routes';
import { propertyResearchFeature } from './propertyResearch/routes';
import { contactFindingFeature } from './contactFinding/routes';
import { liveLookFeature } from './liveLook/routes';

// Register all features here
export const featuresRegistry: FeatureRoutes[] = [
  indexFeature,
  authFeature,
  realEstateFeature,
  salesforceFeature,
  propertyResearchFeature,
  contactFindingFeature,
  liveLookFeature
];

// Get all routes from all features
export const getAllRoutes = () => {
  return featuresRegistry.flatMap(feature => feature.routes);
};

// Get all authenticated routes (those that should be inside MainLayout)
export const getAuthenticatedRoutes = () => {
  return featuresRegistry
    .filter(feature => feature.id !== 'auth') // Filter out auth routes
    .flatMap(feature => feature.routes);
};

// Get only auth routes
export const getAuthRoutes = () => {
  return featuresRegistry
    .filter(feature => feature.id === 'auth')
    .flatMap(feature => feature.routes);
};

// Get features for navigation
export const getNavigationFeatures = () => {
  return featuresRegistry.filter(feature => feature.navItems && feature.navItems.length > 0);
};