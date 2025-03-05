
import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { LoadingState } from '@/components/LoadingState';
import { useSchoolsData } from '@/hooks/use-schools-data';
import { useZoningData } from '@/hooks/use-zoning-data';
import { usePermits } from '@/hooks/use-permits';
import { SchoolsList } from '@/components/SchoolsList';
import { ZoningList } from '@/components/ZoningList';
import { PermitList } from '@/components/PermitList';
import { SearchForm } from '@/components/SearchForm';
import { Search } from 'lucide-react';
import { SearchStatus } from '@/types';

export default function PropertyResearch() {
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  const { 
    schools, 
    status: schoolsStatus, 
    searchedAddress: schoolsAddress,
    fetchSchoolsData
  } = useSchoolsData();
  
  const { 
    zoningData, 
    status: zoningStatus,
    searchedAddress: zoningAddress,
    fetchZoningData
  } = useZoningData();
  
  const { 
    permits, 
    status: permitsStatus,
    searchedAddress: permitsAddress,
    fetchPermits
  } = usePermits();

  const handleSearch = async (address: string) => {
    setIsSearching(true);
    
    try {
      // For schools, we need to pass coordinates
      // Since we don't have coordinates here, we'll use a placeholder
      // The actual geocoding will happen in the SearchForm component
      await fetchSchoolsData({ 
        top_right_lat: 0, 
        top_right_lng: 0 
      }, address);
      
      // For zoning data
      await fetchZoningData(address);
      
      // For permits, we need to create a small bounding box
      // The actual geocoding will happen in the SearchForm component
      await fetchPermits({
        bottom_left_lat: 0,
        bottom_left_lng: 0,
        top_right_lat: 0,
        top_right_lng: 0,
        exact_address: address
      }, address);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Property Research</h1>
            <Navbar />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center mb-4">
              <Search className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Search Property Data</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Enter an address to find nearby schools, zoning information, and building permits.
            </p>
            <SearchForm 
              onSearch={handleSearch} 
              isSearching={isSearching} 
              searchType="property-research" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Nearby Schools</h3>
              {schoolsStatus === "loading" ? (
                <LoadingState className="py-8" message="Loading schools data..." showSpinner={true} />
              ) : schoolsStatus === "error" ? (
                <div className="text-red-500 py-4">Error loading schools data</div>
              ) : (
                <SchoolsList 
                  schools={schools} 
                  isLoading={schoolsStatus === "loading"} 
                  searchedAddress={schoolsAddress} 
                />
              )}
            </div>
            
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Zoning Information</h3>
              {zoningStatus === "loading" ? (
                <LoadingState className="py-8" message="Loading zoning data..." showSpinner={true} />
              ) : zoningStatus === "error" ? (
                <div className="text-red-500 py-4">Error loading zoning data</div>
              ) : (
                <ZoningList 
                  zoningData={zoningData} 
                  isLoading={zoningStatus === "loading"} 
                  searchedAddress={zoningAddress} 
                />
              )}
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Building Permits</h3>
            {permitsStatus === "loading" ? (
              <LoadingState className="py-8" message="Loading permit data..." showSpinner={true} />
            ) : permitsStatus === "error" ? (
              <div className="text-red-500 py-4">Error loading permit data</div>
            ) : (
              <PermitList 
                permits={permits} 
                isLoading={permitsStatus === "loading"} 
                searchedAddress={permitsAddress} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
