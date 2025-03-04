
import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { PermitList } from "@/components/PermitList";
import { ZoningList } from "@/components/ZoningList";
import { usePermits } from "@/hooks/use-permits";
import { useZoningData } from "@/hooks/use-zoning-data";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileTextIcon, MapIcon } from "lucide-react";
import { Permit } from "@/types";

const Index = () => {
  // Permits data
  const { permits, status: permitStatus, searchedAddress, fetchPermits } = usePermits();
  const isSearchingPermits = permitStatus === "loading";
  const [testResults, setTestResults] = useState<{
    permits: Permit[],
    address: string
  } | null>(null);

  // Zoning data
  const { zoningData, status: zoningStatus, searchedAddress: zoningAddress, fetchZoningData } = useZoningData();
  const isSearchingZoning = zoningStatus === "loading";

  // Active tab state
  const [activeTab, setActiveTab] = useState("permits");

  const handleSearch = async (params, address) => {
    setTestResults(null);
    if (activeTab === "permits") {
      await fetchPermits(params, address);
    } else {
      await fetchZoningData(params, address);
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
            defaultValue="permits" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mb-6"
          >
            <TabsList className="bg-white/10 border-white/20 border">
              <TabsTrigger value="permits" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80">
                <FileTextIcon className="h-4 w-4 mr-2" />
                Permits
              </TabsTrigger>
              <TabsTrigger value="zoning" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80">
                <MapIcon className="h-4 w-4 mr-2" />
                Zoning
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="permits" className="mt-4">
              <p className="text-white/90 mb-8 text-balance max-w-2xl">
                Search for building permits and land use data as part of property due diligence. Identify fire safety work, 
                occupancy changes, and other critical permit history to assess property compliance and safety standards.
              </p>
            </TabsContent>
            
            <TabsContent value="zoning" className="mt-4">
              <p className="text-white/90 mb-8 text-balance max-w-2xl">
                Research property zoning regulations and land use requirements for your due diligence. Understand allowed uses, 
                building restrictions, and development limitations to make informed investment decisions.
              </p>
            </TabsContent>
          </Tabs>
          
          <SearchForm 
            onSearch={handleSearch} 
            isSearching={activeTab === "permits" ? isSearchingPermits : isSearchingZoning} 
          />
        </div>
      </motion.header>

      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsContent value="permits" className="mt-0 animate-in fade-in-50">
            {(searchedAddress || (testResults && testResults.address)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h2 className="text-lg md:text-xl font-medium mb-1">Results for</h2>
                <p className="text-muted-foreground">{searchedAddress || testResults?.address}</p>
              </motion.div>
            )}
            
            <PermitList 
              permits={testResults ? testResults.permits : permits} 
              isLoading={isSearchingPermits && !testResults} 
              searchedAddress={searchedAddress || (testResults ? testResults.address : "")}
            />
            
            {!searchedAddress && !testResults && !isSearchingPermits && (
              <motion.div 
                className="py-16 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <h2 className="text-2xl font-medium mb-3">Enter an address to get started</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  As part of property due diligence, search for critical permit records that may affect your investment decision. 
                  This tool helps you identify:
                </p>
                <ul className="mt-4 text-muted-foreground max-w-lg mx-auto text-left list-disc pl-8">
                  <li className="mb-2">Fire safety inspections, upgrades, or violations</li>
                  <li className="mb-2">Occupancy use changes or certifications</li>
                  <li className="mb-2">Building code compliance history</li>
                  <li className="mb-2">Structural modifications and their approvals</li>
                  <li className="mb-2">Historical permit patterns that may indicate property issues</li>
                </ul>
              </motion.div>
            )}
          </TabsContent>
          
          <TabsContent value="zoning" className="mt-0 animate-in fade-in-50">
            <ZoningList
              zoningData={zoningData}
              isLoading={isSearchingZoning}
              searchedAddress={zoningAddress}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-slate-50 dark:bg-slate-900 py-6 px-4 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>Powered by Zoneomics API</p>
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
