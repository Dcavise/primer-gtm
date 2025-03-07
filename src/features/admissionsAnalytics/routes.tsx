import { RouteObject, Navigate } from 'react-router-dom';
import AdmissionsAnalytics from '../../pages/AdmissionsAnalytics';
import { FeatureRoutes } from '../common/routes';

// Define dashboard routes (previously admissions analytics)
const admissionsAnalyticsRoutes: RouteObject[] = [
  {
    path: "dashboard",
    element: <AdmissionsAnalytics />
  },
  // Keep old route temporarily for compatibility
  {
    path: "admissions-analytics",
    element: <Navigate to="/dashboard" replace />
  }
];

export const admissionsAnalyticsFeature: FeatureRoutes = {
  id: 'admissionsAnalytics',
  routes: admissionsAnalyticsRoutes,
  navItems: [
    {
      path: '/dashboard',
      label: 'Dashboard',
      order: 1 // Ensure it appears first
    }
  ]
};
