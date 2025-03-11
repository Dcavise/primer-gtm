import { RouteObject } from "react-router-dom";
import CampusStaffTracker from "../../pages/CampusStaffTracker";
import { FeatureRoutes } from "../common/routes";

const campusStaffRoutes: RouteObject[] = [
  {
    path: "campus-staff",
    element: <CampusStaffTracker />,
  },
];

export const campusStaffFeature: FeatureRoutes = {
  id: "campusStaff",
  routes: campusStaffRoutes,
  navItems: [
    {
      path: "/campus-staff",
      label: "Campus Staff",
      order: 60,
    },
  ],
};
