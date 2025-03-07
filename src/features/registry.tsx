import { FeatureRoutes } from './common/routes';
import { indexFeature } from './common/indexRoute';
import { authFeature } from './auth/routes';
import { realEstateFeature } from './realEstate/routes';
import { salesforceFeature } from './salesforce/routes';
import { propertyResearchFeature } from './propertyResearch/routes';
import { contactFindingFeature } from './contactFinding/routes';
// Live Look feature removed
import { crmFeature } from './crm/routes';
import { atsFeature } from './ats/routes';
import { admissionsAnalyticsFeature } from './admissionsAnalytics/routes';

// Register all features here
export const featuresRegistry: FeatureRoutes[] = [
  // Prioritize admissionsAnalytics by putting it first
  admissionsAnalyticsFeature,
  indexFeature,
  authFeature,
  realEstateFeature,
  salesforceFeature,
  propertyResearchFeature,
  contactFindingFeature,
  // Live Look feature removed
  crmFeature,
  atsFeature
];

// Get all routes from all features
export const getAllRoutes = () => {
  return featuresRegistry.flatMap(feature => feature.routes);
};

// Get all authenticated routes (those that should be inside MainLayout)
export const getAuthenticatedRoutes = () => {
  try {
    // Log the features and routes for debugging
    console.log('Registered features:', featuresRegistry.map(f => f.id));
    
    // Specifically check for the admissionsAnalytics feature
    const admissionsAnalyticsFeatureCheck = featuresRegistry.find(f => f.id === 'admissionsAnalytics');
    console.log('AdmissionsAnalytics feature check:', admissionsAnalyticsFeatureCheck);
    
    if (admissionsAnalyticsFeatureCheck) {
      console.log('AdmissionsAnalytics routes:', admissionsAnalyticsFeatureCheck.routes);
    }
    
    // Add specific check for propertyResearch feature
    const propertyResearchFeatureCheck = featuresRegistry.find(f => f.id === 'propertyResearch');
    console.log('PropertyResearch feature check:', propertyResearchFeatureCheck);
    
    if (propertyResearchFeatureCheck) {
      console.log('PropertyResearch routes:', propertyResearchFeatureCheck.routes);
    }
    
    // Create a copy of featuresRegistry and make sure admissionsAnalytics is first
    const orderedFeatures = [...featuresRegistry];
    
    // Move admissionsAnalytics to the front if it exists
    const admissionsIndex = orderedFeatures.findIndex(f => f.id === 'admissionsAnalytics');
    if (admissionsIndex > 0) {
      const [admissionsFeature] = orderedFeatures.splice(admissionsIndex, 1);
      orderedFeatures.unshift(admissionsFeature);
    }
    
    console.log('Ordered features for routing:', orderedFeatures.map(f => f.id));
    
    const routes = orderedFeatures
      .filter(feature => {
        // Filter out auth routes
        const isAuth = feature.id === 'auth';
        if (isAuth) {
          console.log('Filtering out auth feature');
        }
        return !isAuth;
      })
      .flatMap(feature => {
        console.log(`Processing feature ${feature.id} routes:`, feature.routes);
        
        // Validate routes before returning them
        if (!feature.routes || !Array.isArray(feature.routes)) {
          console.warn(`Feature ${feature.id} has invalid routes:`, feature.routes);
          return [];
        }
        
        // Prioritize specific features
        if (feature.id === 'admissionsAnalytics') {
          console.log('Adding admissionsAnalytics routes with priority');
        }
        
        return feature.routes;
      });
    
    console.log('All authenticated routes:', routes);
    
    // Make sure we're returning at least an array to avoid issues
    return routes || [];
  } catch (error) {
    console.error('Error in getAuthenticatedRoutes:', error);
    return [];
  }
};

// Get only auth routes
export const getAuthRoutes = () => {
  return featuresRegistry
    .filter(feature => feature.id === 'auth')
    .flatMap(feature => feature.routes);
};

// Get features for navigation
export const getNavigationFeatures = () => {
  // Make sure the features with navItems are returned, prioritizing admissionsAnalytics
  const features = featuresRegistry.filter(feature => feature.navItems && feature.navItems.length > 0);
  console.log('Navigation features:', features.map(f => f.id));
  return features;
};