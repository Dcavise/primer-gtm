import React from "react";
import { Navbar } from "@/components/Navbar";
import LeadsByWeekChart from "@/components/salesforce/LeadsByWeekChart";
import SchemaDebugger from "@/components/salesforce/SchemaDebugger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SalesforceMetrics = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Salesforce Metrics</h1>
        
        <Tabs defaultValue="metrics" className="mb-6">
          <TabsList>
            <TabsTrigger value="metrics">Metrics & Visualizations</TabsTrigger>
            <TabsTrigger value="debug">Debug & Schema Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 gap-6">
              <LeadsByWeekChart />
              
              {/* Additional metric components can be added here */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    More Salesforce metrics and visualizations will be added here.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="debug">
            <div className="grid grid-cols-1 gap-6">
              <SchemaDebugger />
              
              <Card>
                <CardHeader>
                  <CardTitle>SQL Functions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">get_fallback_lead_count_by_week_campus</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        This function counts leads grouped by week and campus, with fallback compatibility for different schemas.
                      </p>
                      <pre className="p-2 bg-muted text-xs rounded overflow-auto">
                        SELECT * FROM public.get_fallback_lead_count_by_week_campus(12);
                      </pre>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">get_simple_lead_count_by_week</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        A simpler function that counts leads by week only, without campus grouping. This function adapts to different schema structures.
                      </p>
                      <pre className="p-2 bg-muted text-xs rounded overflow-auto">
                        SELECT * FROM public.get_simple_lead_count_by_week(12);
                      </pre>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">describe_table</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Returns column information for a given table in a specified schema.
                      </p>
                      <pre className="p-2 bg-muted text-xs rounded overflow-auto">
                        SELECT * FROM public.describe_table('salesforce', 'lead');
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SalesforceMetrics; 