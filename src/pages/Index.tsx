
import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { PermitList } from "@/components/PermitList";
import { usePermits } from "@/hooks/use-permits";
import { motion } from "framer-motion";
import { Permit } from "@/types";

const Index = () => {
  const { permits, status, searchedAddress, fetchPermits } = usePermits();
  const isSearching = status === "loading";
  const [testResults, setTestResults] = useState<{
    permits: Permit[],
    address: string
  } | null>(null);

  const handleSearch = async (params, address) => {
    setTestResults(null);
    await fetchPermits(params, address);
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
            <h1 className="text-xl md:text-3xl font-semibold">Primer Permit Explorer</h1>
          </div>
          <p className="text-white/90 mb-8 text-balance max-w-2xl">
            Search for building permits and land use data as part of property due diligence. Identify fire safety work, 
            occupancy changes, and other critical permit history to assess property compliance and safety standards.
          </p>
          <SearchForm onSearch={handleSearch} isSearching={isSearching} />
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
      </main>

      <footer className="bg-slate-50 dark:bg-slate-900 py-6 px-4 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>Powered by Zoneomics API</p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>© {new Date().getFullYear()} Primer Permit Explorer</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
