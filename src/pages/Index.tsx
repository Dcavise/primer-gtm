
import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { PermitList } from "@/components/PermitList";
import { usePermits } from "@/hooks/use-permits";
import { motion } from "framer-motion";

const Index = () => {
  const { permits, status, searchedAddress, fetchPermits } = usePermits();
  const isSearching = status === "loading";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <motion.header 
        className="bg-gradient-to-r from-zoneomics-blue to-zoneomics-blue/80 text-white py-12 px-6 md:py-16 md:px-8"
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
          <SearchForm onSearch={fetchPermits} isSearching={isSearching} />
        </div>
      </motion.header>

      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 max-w-5xl">
        {searchedAddress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-lg md:text-xl font-medium mb-1">Results for</h2>
            <p className="text-muted-foreground">{searchedAddress}</p>
          </motion.div>
        )}
        
        <PermitList 
          permits={permits} 
          isLoading={isSearching} 
          searchedAddress={searchedAddress}
        />
        
        {!searchedAddress && !isSearching && (
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

      <footer className="bg-muted py-6 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <p>Powered by Zoneomics API</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Permit Explorer</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
