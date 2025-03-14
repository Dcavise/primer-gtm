import React from "react";
import AdmissionsAnalytics from "./AdmissionsAnalytics";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Dashboard component that renders the AdmissionsAnalytics component
 * This displays analytics data on the dashboard page
 */
const Dashboard = () => {
  // Sample family ID for testing
  const testFamilyId = "00170000013GHZXAA4";

  return (
    <div>
      {/* TEST BUTTONS - Added for development/testing */}
      <div className="bg-muted/20 p-4 mb-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Test Links</h2>
        <div className="flex gap-2">
          <Link to={`/family-mock/${testFamilyId}`}>
            <Button variant="outline" size="sm">
              View Mock Family Detail
            </Button>
          </Link>
        </div>
      </div>

      {/* Regular dashboard content */}
      <AdmissionsAnalytics />
    </div>
  );
};

export default Dashboard;