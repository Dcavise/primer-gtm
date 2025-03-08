import { FeatureRoutes } from './common/routes';
import { indexFeature } from './common/indexRoute';
import { realEstateFeature } from './realEstate/routes';
import { salesforceFeature } from './salesforce/routes';
import { contactFindingFeature } from './contactFinding/routes';
import { crmFeature } from './crm/routes';
import { atsFeature } from './ats/routes';
import { admissionsAnalyticsFeature } from './admissionsAnalytics/routes';
import { logger } from '@/utils/logger';

// Register all features here with admissionsAnalytics prioritized first
export const featuresRegistry: FeatureRoutes[] = [
  admissionsAnalyticsFeature,
  indexFeature,
  realEstateFeature,
  salesforceFeature,
  contactFindingFeature,
  crmFeature,
  atsFeature
];

// Get all routes from all features
export const getAllRoutes = () => {
  return featuresRegistry.flatMap(feature => feature.routes);
};

// Get all routes for MainLayout
export const getAuthenticatedRoutes = () => {
  try {
    const routes = featuresRegistry
      .flatMap(feature => {
        // Validate routes before returning them
        if (!feature.routes || !Array.isArray(feature.routes)) {
          logger.warn(`Feature ${feature.id} has invalid routes`);
          return [];
        }
        return feature.routes;
      });
    
    return routes;
  } catch (error) {
    logger.error('Error in getAuthenticatedRoutes:', error);
    return [];
  }
};

// Get empty auth routes (auth has been removed)
export const getAuthRoutes = () => {
  return [];
};

// Get features for navigation
export const getNavigationFeatures = () => {
  return featuresRegistry.filter(feature => 
    feature.navItems && feature.navItems.length > 0
  );
};