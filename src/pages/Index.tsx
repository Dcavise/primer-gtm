import { useState, useEffect } from "react";
import { SearchForm } from "@/components/SearchForm";
import { PermitList } from "@/components/PermitList";
import { ZoningList } from "@/components/ZoningList";
import { CensusList } from "@/components/CensusList";
import { SchoolsList } from "@/components/SchoolsList";
import { PropertySummary } from "@/components/PropertySummary";
import { usePermits } from "@/hooks/use-permits";
import { useZoningData } from "@/hooks/use-zoning-data";
import { useCensusData } from "@/hooks/use-census-data";
import { useSchoolsData } from "@/hooks/use-schools-data";
import { usePropertySummary } from "@/hooks/use-property-summary";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileTextIcon, MapIcon, BarChart3Icon, School, SearchIcon, ClipboardIcon } from "lucide-react";
import { Permit } from "@/types";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  // Permits data
  const { permits, status: permitStatus, searchedAddress: permitAddress, fetchPermits } = usePermits();
  const isSearchingPermits = permitStatus === "loading";
  const [testResults, setTestResults] = useState<{
    permits: Permit[],
    address: string
  } | null>(null);

  // Zoning data
  const { zoningData, status: zoningStatus, searchedAddress: zoningAddress, fetchZoningData } = useZoningData();
  const isSearchingZoning = zoningStatus === "loading";

  // Census data
  const { censusData, censusResponse, status: censusStatus, searchedAddress: censusAddress, fetchCensusData } = useCensusData();
  const isSearchingCensus = censusStatus === "loading";

  // Schools data
  const { schools, status: schoolsStatus, searchedAddress: schoolsAddress, fetchSchoolsData } = useSchoolsData();
  const isSearchingSchools = schoolsStatus === "loading";

  // Property summary data
  const { summary, status: summaryStatus, searchedAddress: summaryAddress, generateSummary } = usePropertySummary();
  const isGeneratingSummary = summaryStatus === "loading";

  // Consolidated state
  const [userAddress, setUserAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeSection, setActiveSection] = useState<"summary" | "permits" | "zoning" | "census" | "schools" | "property-research">("summary");
  
  // Determine if any data is loading
  const isAnyDataLoading = isSearchingPermits || isSearchingZoning || isSearchingCensus || isSearchingSchools || isGeneratingSummary;
  
  // Determine the current displayed address (prioritize the active section's address)
  const displayedAddress = activeSection === "permits" ? permitAddress : 
                          activeSection === "zoning" ? zoningAddress :
                          activeSection === "census" ? censusAddress : 
                          activeSection === "summary" ? summaryAddress || userAddress :
                          schoolsAddress || userAddress;

  // Keep track of API call completion
  const [apiCallsStatus, setApiCallsStatus] = useState({
    permits: false,
    zoning: false,
    census: false,
    schools: false
  });

  // Check if all API calls are complete and data is ready for summary generation
  useEffect(() => {
    const allComplete = apiCallsStatus.permits && 
                        apiCallsStatus.zoning && 
                        apiCallsStatus.census && 
                        apiCallsStatus.schools;

    // Generate summary only when all data is fetched AND we have an address
    if (allComplete && userAddress && !summary && summaryStatus !== "loading") {
      console.log("All API calls complete, generating summary for:", userAddress);
      console.log("Using current zoning data:", zoningData);
      generateSummary(userAddress, permits, zoningData, censusData, schools);
    }
  }, [apiCallsStatus, userAddress, permits, zoningData, censusData, schools, summary, summaryStatus, generateSummary]);

  // Reset API call status when starting a new search
  useEffect(() => {
    if (isSearching) {
      setApiCallsStatus({
        permits: false,
        zoning: false,
        census: false,
        schools: false
      });
    }
  }, [isSearching]);

  // Update API call status when individual data fetches complete
  useEffect(() => {
    if (permitStatus === "success" || permitStatus === "error") {
      setApiCallsStatus(prev => ({ ...prev, permits: true }));
    }
  }, [permitStatus]);

  useEffect(() => {
    if (zoningStatus === "success" || zoningStatus === "error") {
      setApiCallsStatus(prev => ({ ...prev, zoning: true }));
    }
  }, [zoningStatus]);

  useEffect(() => {
    if (censusStatus === "success" || censusStatus === "error") {
      setApiCallsStatus(prev => ({ ...prev, census: true }));
    }
  }, [censusStatus]);

  useEffect(() => {
    if (schoolsStatus === "success" || schoolsStatus === "error") {
      setApiCallsStatus(prev => ({ ...prev, schools: true }));
    }
  }, [schoolsStatus]);

  const handleSearchAllData = async (params: any, address: string) => {
    setUserAddress(address);
    setIsSearching(true);
    setTestResults(null);
    
    toast.info("Searching property data", {
      description: "Fetching all available data for this location..."
    });
    
    try {
      // Start all API requests concurrently
      await Promise.all([
        fetchPermits(params, address),
        fetchZoningData(address),
        fetchCensusData(address),
        fetchSchoolsData(params, address)
      ]);
      
      // Set active section to summary first
      setActiveSection("summary");
      
      // Summary generation is now handled by the useEffect above
      // after all API calls complete
      
      toast.success("Property research complete", {
        description: "All available data has been retrieved for this location."
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

  // Function to manually generate summary if not done automatically
  const handleGenerateSummary = () => {
    if (displayedAddress) {
      generateSummary(displayedAddress, permits, zoningData, censusData, schools);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <motion.header 
        className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-12 px-6 md:py-16 md:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-3">
            <img 
              src="/lovable-uploads/532db431-7977-460c-a6f0-28a7513e5091.png" 
              alt="Primer Logo" 
              className="h-10 w-auto bg-white p-1 rounded"
            />
            <h1 className="text-xl md:text-3xl font-semibold">Primer Property Explorer</h1>
          </div>
          
          <Tabs 
            defaultValue="property-research" 
            value="property-research"
            className="mb-6"
          >
            <TabsList className="bg-white/10 border-white/20 border">
              <TabsTrigger value="property-research" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80">
                <SearchIcon className="h-4 w-4 mr-2" />
                Property Research
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="property-research" className="mt-4">
              <p className="text-white/90 mb-8 text-balance max-w-2xl">
                Search for property data to support your due diligence. Get comprehensive information on building permits, 
                zoning regulations, demographic statistics, and nearby schools - all from a single address search.
              </p>
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
              <li className="mb-2">Demographic and economic statistics</li>
              <li className="mb-2">Nearby schools with ratings and details</li>
            </ul>
          </motion.div>
        )}
        
        {displayedAddress && (
          <Tabs 
            defaultValue="summary" 
            value={activeSection} 
            onValueChange={(value) => setActiveSection(value as any)}
            className="mt-6"
          >
            <TabsList className="bg-background border-b w-full justify-start overflow-x-auto">
              <TabsTrigger value="summary" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <ClipboardIcon className="h-4 w-4 mr-2" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="permits" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <FileTextIcon className="h-4 w-4 mr-2" />
                Permits
              </TabsTrigger>
              <TabsTrigger value="zoning" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <MapIcon className="h-4 w-4 mr-2" />
                Zoning
              </TabsTrigger>
              <TabsTrigger value="census" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <BarChart3Icon className="h-4 w-4 mr-2" />
                Census
              </TabsTrigger>
              <TabsTrigger value="schools" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <School className="h-4 w-4 mr-2" />
                Schools
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="py-6 animate-in fade-in-50">
              <PropertySummary
                summary={summary}
                isLoading={isGeneratingSummary}
                searchedAddress={displayedAddress}
                onGenerateSummary={handleGenerateSummary}
              />
            </TabsContent>
            
            <TabsContent value="permits" className="py-6 animate-in fade-in-50">
              <PermitList 
                permits={testResults ? testResults.permits : permits} 
                isLoading={isSearchingPermits && !testResults} 
                searchedAddress={permitAddress || (testResults ? testResults.address : "")}
              />
            </TabsContent>
            
            <TabsContent value="zoning" className="py-6 animate-in fade-in-50">
              <ZoningList
                zoningData={zoningData}
                isLoading={isSearchingZoning}
                searchedAddress={zoningAddress}
              />
            </TabsContent>
            
            <TabsContent value="census" className="py-6 animate-in fade-in-50">
              <CensusList
                censusData={censusData}
                isLoading={isSearchingCensus}
                searchedAddress={censusAddress}
                isMockData={censusResponse?.tractsIncluded === 0}
                censusResponse={censusResponse}
                onTryMockData={() => useCensusData().loadMockData()}
              />
            </TabsContent>
            
            <TabsContent value="schools" className="py-6 animate-in fade-in-50">
              <SchoolsList
                schools={schools}
                isLoading={isSearchingSchools}
                searchedAddress={schoolsAddress}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer className="bg-slate-50 dark:bg-slate-900 py-6 px-4 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>Powered by Zoneomics API, U.S. Census Bureau & GreatSchools API</p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>© {new Date().getFullYear()} Primer Property Explorer</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
