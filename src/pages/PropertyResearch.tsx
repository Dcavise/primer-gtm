
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { LoadingState } from '@/components/LoadingState';
import { useSchoolsData } from '@/hooks/use-schools-data';
import { useZoningData } from '@/hooks/use-zoning-data';
import { usePermits } from '@/hooks/use-permits';
import { SchoolsList } from '@/components/SchoolsList';
import { ZoningList } from '@/components/ZoningList';
import { PermitList } from '@/components/PermitList';
import { SearchForm } from '@/components/SearchForm';
import { SearchOutlined } from 'lucide-react';

export default function PropertyResearch() {
  const { 
    schools, 
    loading: schoolsLoading, 
    error: schoolsError, 
    fetchSchoolsByAddress 
  } = useSchoolsData();
  
  const { 
    zoningData, 
    loading: zoningLoading, 
    error: zoningError, 
    fetchZoningByAddress 
  } = useZoningData();
  
  const { 
    permits, 
    loading: permitsLoading, 
    error: permitsError, 
    fetchPermitsByAddress 
  } = usePermits();

  const handleSearch = async (address: string) => {
    fetchSchoolsByAddress(address);
    fetchZoningByAddress(address);
    fetchPermitsByAddress(address);
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
              <SearchOutlined className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Search Property Data</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Enter an address to find nearby schools, zoning information, and building permits.
            </p>
            <SearchForm onSearch={handleSearch} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Nearby Schools</h3>
              {schoolsLoading ? (
                <LoadingState className="py-8" message="Loading schools data..." showSpinner={true} />
              ) : schoolsError ? (
                <div className="text-red-500 py-4">{schoolsError}</div>
              ) : (
                <SchoolsList schools={schools} />
              )}
            </div>
            
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Zoning Information</h3>
              {zoningLoading ? (
                <LoadingState className="py-8" message="Loading zoning data..." showSpinner={true} />
              ) : zoningError ? (
                <div className="text-red-500 py-4">{zoningError}</div>
              ) : (
                <ZoningList zoningData={zoningData} />
              )}
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Building Permits</h3>
            {permitsLoading ? (
              <LoadingState className="py-8" message="Loading permit data..." showSpinner={true} />
            ) : permitsError ? (
              <div className="text-red-500 py-4">{permitsError}</div>
            ) : (
              <PermitList permits={permits} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
