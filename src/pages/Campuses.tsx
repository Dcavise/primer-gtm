
import { CampusesManagement } from "@/components/CampusesManagement";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Campuses = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-semibold">Campuses Management</h1>
          <p className="text-white/80 mt-2">
            View and manage campus information
          </p>
          <div className="mt-4">
            <Button asChild variant="secondary">
              <Link to="/fellows">Back to Fellows</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
        <CampusesManagement />
      </main>
    </div>
  );
};

export default Campuses;
