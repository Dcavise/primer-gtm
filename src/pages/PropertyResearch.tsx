import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { FileTextIcon, MapIcon, School, SearchIcon } from "lucide-react";

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
              <SearchIcon className="mr-2 h-4 w-4" />
              Search Property
            </Button>
          </div>
          
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">
                <MapIcon className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="zoning">
                <MapIcon className="mr-2 h-4 w-4" />
                Zoning
              </TabsTrigger>
              <TabsTrigger value="schools">
                <School className="mr-2 h-4 w-4" />
                Schools
              </TabsTrigger>
              <TabsTrigger value="permits">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Permits
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Property Overview</CardTitle>
                  <CardDescription>Search for a property to view details</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Enter an address to retrieve comprehensive information for your due diligence:</p>
                  <ul className="mt-4 list-disc pl-5 space-y-2">
                    <li>Building permits and code compliance history</li>
                    <li>Zoning regulations and land use requirements</li>
                    <li>Nearby schools with ratings and details</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="zoning">
              <Card>
                <CardHeader>
                  <CardTitle>Zoning Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Search for a property to view zoning information
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schools">
              <Card>
                <CardHeader>
                  <CardTitle>Nearby Schools</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Search for a property to view nearby schools
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permits">
              <Card>
                <CardHeader>
                  <CardTitle>Building Permits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Search for a property to view building permits
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyResearch;
