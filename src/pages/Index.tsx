
import { useState, useEffect } from "react";
import { SearchForm } from "@/components/SearchForm";
import { PermitList } from "@/components/PermitList";
import { usePermits } from "@/hooks/use-permits";
import { motion } from "framer-motion";
import { testMiamiAddress } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Permit } from "@/types";
import { toast } from "sonner";

const Index = () => {
  const { permits, status, searchedAddress, fetchPermits } = usePermits();
  const isSearching = status === "loading";
  const [testResults, setTestResults] = useState<{
    permits: Permit[],
    address: string
  } | null>(null);

  const runMiamiTest = async () => {
    toast.info("Running test with Miami coordinates...");
    const result = await testMiamiAddress();
    
    if (result && result.permits.length > 0) {
      setTestResults({
        permits: result.permits,
        address: "Miami Beach Area (Test)"
      });
      toast.success(`Found ${result.permits.length} permits in Miami area`);
    } else {
      toast.error("Test failed or no permits found");
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
            <div className="bg-white/20 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h1 className="text-xl md:text-3xl font-semibold">Zoneomics Permit Explorer</h1>
          </div>
          <p className="text-white/90 mb-8 text-balance max-w-2xl">
            Search for building permits and land use data by address. Discover historical permit information for properties and analyze zoning changes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Button 
              variant="secondary" 
              onClick={runMiamiTest}
              className="hover:bg-white/30 bg-white/20 text-white border border-white/20"
            >
              Test with Miami Address
            </Button>
          </div>
          <SearchForm onSearch={fetchPermits} isSearching={isSearching} />
        </div>
      </motion.header>

      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 max-w-5xl">
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
          isLoading={isSearching && !testResults} 
          searchedAddress={searchedAddress || (testResults ? testResults.address : "")}
        />
        
        {!searchedAddress && !testResults && !isSearching && (
          <motion.div 
            className="py-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-2xl font-medium mb-3">Enter an address to get started</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Search for any address to find permit history, zoning information, and building regulations. 
              The tool will retrieve all permit records associated with the specified location.
            </p>
          </motion.div>
        )}
      </main>

      <footer className="bg-slate-50 dark:bg-slate-900 py-6 px-4 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>Powered by Zoneomics API</p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>© {new Date().getFullYear()} Permit Explorer</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
