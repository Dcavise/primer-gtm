import { RouteObject } from 'react-router-dom';
import RealEstatePipeline from '../../pages/RealEstatePipeline';
import PropertyDetail from '../../pages/PropertyDetail';
import { FeatureRoutes } from '../common/routes';

const realEstateRoutes: RouteObject[] = [
  {
    path: "real-estate-pipeline",
    element: <RealEstatePipeline />
  },
  {
    path: "real-estate-pipeline/property/:id",
    element: <PropertyDetail />
  }
];

export const realEstateFeature: FeatureRoutes = {
  id: 'realEstate',
  routes: realEstateRoutes,
  navItems: [
    {
      path: '/real-estate-pipeline',
      label: 'Real Estate Pipeline',
      order: 20
    }
  ]
};