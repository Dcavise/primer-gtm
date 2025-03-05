
import { useState, useEffect } from "react";
import { SearchForm } from "@/components/SearchForm";
import { PermitList } from "@/components/PermitList";
import { ZoningList } from "@/components/ZoningList";
import { SchoolsList } from "@/components/SchoolsList";
import { usePermits } from "@/hooks/use-permits";
import { useZoningData } from "@/hooks/use-zoning-data";
import { useSchoolsData } from "@/hooks/use-schools-data";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileTextIcon, MapIcon, School, SearchIcon } from "lucide-react";
import { Permit } from "@/types";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { geocodeAddress } from "@/utils/geocoding";
import { Navbar } from "@/components/Navbar";

const PropertyResearch = () => {
  // Permits data
  const { permits, status: permitStatus, searchedAddress: permitAddress, fetchPermits, reset: resetPermits } = usePermits();
  const isSearchingPermits = permitStatus === "loading";
  const [testResults, setTestResults] = useState<{
    permits: Permit[],
    address: string
  } | null>(null);

  // Zoning data
  const { zoningData, status: zoningStatus, searchedAddress: zoningAddress, fetchZoningData, reset: resetZoning } = useZoningData();
  const isSearchingZoning = zoningStatus === "loading";

  // Schools data
  const { schools, status: schoolsStatus, searchedAddress: schoolsAddress, fetchSchoolsData, reset: resetSchools } = useSchoolsData();
  const isSearchingSchools = schoolsStatus === "loading";

  // Geocoded coordinates
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Consolidated state
  const [userAddress, setUserAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Determine if any data is loading
  const isAnyDataLoading = isSearchingPermits || isSearchingZoning || isSearchingSchools;
  
  // Determine the current displayed address (use first available address)
  const displayedAddress = zoningAddress || schoolsAddress || permitAddress || userAddress;

  const handleSearchAllData = async (params: any, address: string) => {
    // First, reset everything
    setUserAddress("");
    setTestResults(null);
    resetPermits();
    resetZoning();
    resetSchools();
    setCoordinates(null);
    
    // Then start the new search
    setUserAddress(address);
    setIsSearching(true);
    
    toast.info("Searching property data", {
      description: "Fetching all available data for this location..."
    });
    
    try {
      // Geocode the address to get coordinates
      const geocodingResult = await geocodeAddress(address);
      if (geocodingResult) {
        setCoordinates(geocodingResult.coordinates);
      }
      
      // Start all API requests concurrently
      await Promise.all([
        fetchPermits(params, address),
        fetchZoningData(address),
        fetchSchoolsData(params, address)
      ]);
      
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <motion.header 
        className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-12 px-6 md:py-16 md:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/532db431-7977-460c-a6f0-28a7513e5091.png" 
                alt="Primer Logo" 
                className="h-10 w-auto bg-white p-1 rounded"
              />
              <h1 className="text-xl md:text-3xl font-semibold">Primer Property Explorer</h1>
            </div>
            <Navbar />
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
                zoning regulations, and nearby schools - all from a single address search.
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
              <li className="mb-2">Nearby schools with ratings and details</li>
            </ul>
          </motion.div>
        )}
        
        {displayedAddress && (
          <div className="space-y-12 mt-6">
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
    </div>
  );
};

export default PropertyResearch;
