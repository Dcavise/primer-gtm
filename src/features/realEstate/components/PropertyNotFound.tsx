import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PropertyNotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate("/real-estate-pipeline");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Property Not Found</h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4">
        <Button variant="outline" onClick={handleBackClick} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pipeline
        </Button>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <div className="text-destructive mb-4 text-xl">Property Not Found</div>
          <div className="text-sm text-muted-foreground mb-6">
            The requested property could not be found or may have been deleted
          </div>
          <Button variant="default" onClick={handleBackClick}>
            Return to Pipeline
          </Button>
        </div>
      </main>
    </div>
  );
};

export default PropertyNotFound;
