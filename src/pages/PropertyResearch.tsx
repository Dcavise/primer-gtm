import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapIcon, BookOpenIcon, SchoolIcon, FileTextIcon } from "lucide-react";

const PropertyResearch = () => {
  return (
    <div className="container mx-auto p-6">
      <Card className="mb-8">
        <CardHeader className="bg-slate-50">
          <CardTitle>Property Research</CardTitle>
          <CardDescription>Search for property data to support your due diligence</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Property Explorer</h2>
              <p className="text-muted-foreground">Get comprehensive information on properties</p>
            </div>
            <Button>
              <MapIcon className="mr-2 h-4 w-4" />
              Search Property
            </Button>
          </div>
          
          <div className="mt-6">
            <p>Enter an address to retrieve comprehensive information for your due diligence:</p>
            <ul className="mt-4 list-disc pl-5 space-y-2">
              <li>Building permits and code compliance history</li>
              <li>Zoning regulations and land use requirements</li>
              <li>Nearby schools with ratings and details</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapIcon className="h-5 w-5 mr-2" />
              Zoning Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">
              Search for a property to view zoning information
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SchoolIcon className="h-5 w-5 mr-2" />
              Nearby Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">
              Search for a property to view nearby schools
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileTextIcon className="h-5 w-5 mr-2" />
              Building Permits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">
              Search for a property to view building permits
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpenIcon className="h-5 w-5 mr-2" />
              Property Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">
              Get AI-powered insights based on property data
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PropertyResearch;
