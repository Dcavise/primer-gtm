import { useState, useEffect } from "react";
import { SearchForm } from "@/components/SearchForm";
import { PermitList } from "@/components/PermitList";
import { ZoningList } from "@/components/ZoningList";
import { SchoolsList } from "@/components/SchoolsList";
import { usePermits } from "@/hooks/use-permits";
import { useZoningData } from "@/hooks/use-zoning-data";
import { useSchoolsData } from "@/hooks/use-schools-data";
import { useAiInsights, PropertyInsight } from "@/hooks/use-ai-insights";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileTextIcon, MapIcon, School, SearchIcon, Sparkles, BrainCircuit, Lightbulb, AlertCircle, Cloud, Laptop } from "lucide-react";
import { Permit } from "@/types";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PropertyResearch = () => {
  // Permits data
  const { permits, status: permitStatus, searchedAddress: permitAddress, isUsingFallbackData: isUsingFallbackPermitData, fetchPermits, reset: resetPermits } = usePermits();
  const isSearchingPermits = permitStatus === "loading";
  const [testResults, setTestResults] = useState<{
    permits: Permit[],
    address: string
  } | null>(null);

  // Zoning data
  const { zoningData, status: zoningStatus, searchedAddress: zoningAddress, isUsingFallbackData: isUsingFallbackZoningData, fetchZoningData, reset: resetZoning } = useZoningData();
  const isSearchingZoning = zoningStatus === "loading";

  // Schools data
  const { schools, status: schoolsStatus, searchedAddress: schoolsAddress, fetchSchoolsData, reset: resetSchools } = useSchoolsData();
  const isSearchingSchools = schoolsStatus === "loading";

  // AI insights hook
  const { 
    insights: aiInsights, 
    loading: aiInsightsLoading, 
    generateInsights, 
    reset: resetAiInsights,
    toggleEdgeFunctionMode,
    getEdgeFunctionMode
  } = useAiInsights();
  
  // State for edge function mode
  const [isEdgeFunctionMode, setIsEdgeFunctionMode] = useState(false);

  // Consolidated state
  const [userAddress, setUserAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Determine if any data is loading
  const isAnyDataLoading = isSearchingPermits || isSearchingZoning || isSearchingSchools || aiInsightsLoading;
  
  // Determine the current displayed address (use first available address)
  const displayedAddress = zoningAddress || schoolsAddress || permitAddress || userAddress;

  // Effect to initialize edge function mode state from localStorage
  useEffect(() => {
    setIsEdgeFunctionMode(getEdgeFunctionMode());
  }, []);
  
  // Handle toggling edge function mode
  const handleToggleEdgeFunctionMode = () => {
    const newMode = toggleEdgeFunctionMode();
    setIsEdgeFunctionMode(newMode);
  };
  
  const handleSearchAllData = async (params: any, address: string) => {
    // First, reset everything
    setUserAddress("");
    setTestResults(null);
    resetPermits();
    resetZoning();
    resetSchools();
    resetAiInsights();
    
    // Then start the new search
    setUserAddress(address);
    setIsSearching(true);
    
    toast.info("Searching property data", {
      description: "Fetching all available data for this location..."
    });
    
    try {
      console.log("Starting consolidated property search with params:", params);
      
      // Start fetching zoning data immediately using just the address
      // This doesn't require coordinates, so we can start it right away
      const zoningPromise = fetchZoningData(address);
      
      // For permits and schools, we need coordinates
      if (params.coordinates) {
        const coordinates = params.coordinates;
        console.log(`Using coordinates for search: (${coordinates.lat}, ${coordinates.lng})`);
        
        // Start these requests concurrently after we have coordinates
        await Promise.all([
          // Wait for zoning data (which we already started)
          zoningPromise,
          
          // Fetch permits with a very small bounding box
          fetchPermits({
            bottom_left_lat: coordinates.lat - 0.0001,
            bottom_left_lng: coordinates.lng - 0.0001,
            top_right_lat: coordinates.lat + 0.0001,
            top_right_lng: coordinates.lng + 0.0001,
            exact_address: address
          }, address),
          
          // Fetch schools data with coordinates
          fetchSchoolsData({
            lat: coordinates.lat,
            lon: coordinates.lng
          }, address)
        ]);
      } else {
        // If no coordinates, at least try to get zoning data
        console.log("No coordinates available, only fetching zoning data");
        await zoningPromise;
        
        toast.warning("Limited property data available", {
          description: "Only zoning data could be retrieved. Address coordinates could not be determined."
        });
      }
      
      toast.success("Property research complete", {
        description: "All available data has been retrieved for this location."
      });
      
      // Generate AI insights based on the collected data
      generateInsights({
        address: address,
        permits: permits,
        zoningData: zoningData,
        schools: schools
      });
    } catch (error) {
      console.error("Error in consolidated search:", error);
      toast.error("Search error", {
        description: "There was a problem retrieving some property data."
      });
    } finally {
      setIsSearching(false);
    }
  };


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
          
          <SearchForm 
            onSearch={handleSearchAllData} 
            isSearching={isAnyDataLoading}
            searchType="property-research"
          />
        </div>
      </motion.header>

      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 max-w-5xl">
        {displayedAddress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-lg md:text-xl font-medium mb-1">Results for</h2>
            <p className="text-muted-foreground">{displayedAddress}</p>
          </motion.div>
        )}
        
        {!displayedAddress && !isAnyDataLoading && (
          <motion.div 
            className="py-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-2xl font-medium mb-3">Enter an address to get started</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Search for any property address to retrieve comprehensive information for your due diligence:
            </p>
            <ul className="mt-4 text-muted-foreground max-w-lg mx-auto text-left list-disc pl-8">
              <li className="mb-2">Building permits and code compliance history</li>
              <li className="mb-2">Zoning regulations and land use requirements</li>
              <li className="mb-2">Nearby schools with ratings and details</li>
            </ul>
          </motion.div>
        )}
        
        {displayedAddress && (
          <div className="space-y-12 mt-6">
            {/* AI Insights Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="h-5 w-5 text-purple-500" />
                <h2 className="text-xl font-medium">AI-Powered Insights</h2>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Property Analysis
                  </CardTitle>
                  <CardDescription>
                    AI-generated insights based on property data, permits, zoning, and nearby schools
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {aiInsightsLoading ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-64" />
                        </div>
                      </div>
                      <Skeleton className="h-24 w-full" />
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-64" />
                        </div>
                      </div>
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : aiInsights.length > 0 ? (
                    <div className="space-y-4">
                      <Accordion type="single" collapsible className="w-full">
                        {aiInsights.map((insight, index) => (
                          <AccordionItem key={index} value={`insight-${index}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2 text-left">
                                {insight.type === 'opportunity' && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <Lightbulb className="h-3 w-3 mr-1" /> Opportunity
                                  </Badge>
                                )}
                                {insight.type === 'risk' && (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    <AlertCircle className="h-3 w-3 mr-1" /> Risk Factor
                                  </Badge>
                                )}
                                {insight.type === 'recommendation' && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <Sparkles className="h-3 w-3 mr-1" /> Recommendation
                                  </Badge>
                                )}
                                <span className="font-medium">{insight.title}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <p className="text-muted-foreground">{insight.description}</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No insights available for this property yet.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => generateInsights({
                          address: displayedAddress,
                          permits: permits,
                          zoningData: zoningData,
                          schools: schools
                        })}
                      >
                        <BrainCircuit className="h-4 w-4 mr-2" />
                        Generate Insights
                      </Button>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex flex-col gap-4 border-t pt-4">
                  <div className="flex justify-between w-full items-center">
                    <p className="text-xs text-muted-foreground">
                      Insights are generated using AI analysis of public data and may not reflect all property conditions.
                    </p>
                    {!aiInsightsLoading && aiInsights.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => generateInsights({
                        address: displayedAddress,
                        permits: permits,
                        zoningData: zoningData,
                        schools: schools
                      })}>
                        <BrainCircuit className="h-4 w-4 mr-2" />
                        Refresh Analysis
                      </Button>
                    )}
                  </div>
                  
                  {/* Edge Function Mode Toggle */}
                  <div className="flex items-center justify-end w-full gap-2 border-t pt-3">
                    <div className="flex items-center space-x-2">
                      <Laptop className={`h-4 w-4 ${!isEdgeFunctionMode ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <Switch 
                        id="edge-function-mode" 
                        checked={isEdgeFunctionMode}
                        onCheckedChange={handleToggleEdgeFunctionMode}
                      />
                      <Cloud className={`h-4 w-4 ${isEdgeFunctionMode ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <Label htmlFor="edge-function-mode" className="text-xs">
                        {isEdgeFunctionMode ? 'Using MCP Server' : 'Using Local Analysis'}
                      </Label>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </section>
            {/* Zoning Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <MapIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-medium">Zoning Information</h2>
              </div>
              <ZoningList
                zoningData={zoningData}
                isLoading={isSearchingZoning}
                searchedAddress={zoningAddress}
                isUsingFallbackData={isUsingFallbackZoningData}
              />
            </section>
            
            <Separator className="my-8" />
            
            {/* Schools Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <School className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-medium">Schools</h2>
              </div>
              <SchoolsList
                schools={schools}
                isLoading={isSearchingSchools}
                searchedAddress={schoolsAddress}
              />
            </section>
            
            <Separator className="my-8" />
            
            {/* Permits Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileTextIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-medium">Building Permits</h2>
              </div>
              <PermitList 
                permits={testResults ? testResults.permits : permits} 
                isLoading={isSearchingPermits && !testResults} 
                searchedAddress={permitAddress || (testResults ? testResults.address : "")}
                isUsingFallbackData={isUsingFallbackPermitData}
              />
            </section>
          </div>
        )}
      </main>

      <footer className="bg-slate-50 dark:bg-slate-900 py-6 px-4 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>Powered by Zoneomics API & GreatSchools API</p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>© {new Date().getFullYear()} Primer Property Explorer</p>
            </div>
          </div>
        </div>
      </footer>
>>>>>>> Stashed changes
    </div>
  );
};

export default PropertyResearch;
