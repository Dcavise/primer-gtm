
import { FellowsDataSync } from "@/components/FellowsDataSync";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Fellows = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-semibold">Fellows Data Management</h1>
          <p className="text-white/80 mt-2">
            View and synchronize fellows data from Google Sheets
          </p>
          <div className="mt-4 space-x-2">
            <Button asChild variant="secondary">
              <Link to="/campuses">Manage Campuses</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/salesforce-leads">View Salesforce Leads</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
        <FellowsDataSync />
      </main>
    </div>
  );
};

export default Fellows;
