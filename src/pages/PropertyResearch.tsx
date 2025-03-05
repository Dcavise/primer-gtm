
import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { SearchForm } from '@/components/SearchForm';
import { PermitList } from '@/components/PermitList';
import { SchoolsList } from '@/components/SchoolsList';
import { ZoningList } from '@/components/ZoningList';
import { usePermits } from '@/hooks/use-permits';
import { useSchoolsData } from '@/hooks/use-schools-data';
import { useZoningData } from '@/hooks/use-zoning-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { SearchStatus } from '@/types';

const PropertyResearch: React.FC = () => {
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  const {
    permits,
    status: permitsStatus,
    searchedAddress: permitAddress,
    fetchPermits,
  } = usePermits();
  
  const {
    schools,
    searchResponse: schoolsResponse,
    status: schoolsStatus,
    searchedAddress: schoolsAddress,
    fetchSchoolsData,
  } = useSchoolsData();
  
  const {
    zoningData,
    status: zoningStatus,
    searchedAddress: zoningAddress,
    fetchZoningData,
  } = useZoningData();

  const handleSearch = async (params: any, address: string) => {
    setSearchAddress(address);
    
    // Extract coordinates from params
    if (params.top_right_lat && params.top_right_lng) {
      setCoordinates({
        lat: params.top_right_lat,
        lng: params.top_right_lng
      });
      
      // Fetch permits data
      await fetchPermits(params, address);
      
      // Fetch schools data
      await fetchSchoolsData({
        top_right_lat: params.top_right_lat,
        top_right_lng: params.top_right_lng,
      }, address);
      
      // Fetch zoning data
      await fetchZoningData(address);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-7xl mx-auto p-4 md:p-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-bold">Property Research</CardTitle>
          </CardHeader>
          <CardContent>
            <SearchForm 
              onSearch={handleSearch} 
              isSearching={permitsStatus === SearchStatus.LOADING || 
                          schoolsStatus === SearchStatus.LOADING || 
                          zoningStatus === SearchStatus.LOADING}
              searchType="property-research"
            />
          </CardContent>
        </Card>

        {searchAddress && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Results for: {searchAddress}</h2>
            {coordinates && (
              <p className="text-sm text-gray-500 mb-4">
                Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>
        )}

        {(permitsStatus === SearchStatus.LOADING || schoolsStatus === SearchStatus.LOADING || zoningStatus === SearchStatus.LOADING) && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Loading data, please wait...</AlertDescription>
          </Alert>
        )}

        {searchAddress && (
          <Tabs defaultValue="permits" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="permits">Building Permits</TabsTrigger>
              <TabsTrigger value="schools">Schools</TabsTrigger>
              <TabsTrigger value="zoning">Zoning</TabsTrigger>
            </TabsList>
            
            <TabsContent value="permits">
              {permitsStatus === SearchStatus.SUCCESS && permitAddress && (
                <PermitList 
                  permits={permits} 
                  searchedAddress={permitAddress}
                  isLoading={permitsStatus === SearchStatus.LOADING}
                />
              )}
            </TabsContent>
            
            <TabsContent value="schools">
              {schoolsStatus === SearchStatus.SUCCESS && schoolsAddress && (
                <SchoolsList 
                  schools={schools} 
                  searchedAddress={schoolsAddress}
                  isLoading={schoolsStatus === SearchStatus.LOADING}
                  radiusMiles={schoolsResponse?.radiusMiles || 5}
                />
              )}
            </TabsContent>
            
            <TabsContent value="zoning">
              {zoningStatus === SearchStatus.SUCCESS && zoningAddress && (
                <ZoningList 
                  zoningData={zoningData} 
                  searchedAddress={zoningAddress}
                  isLoading={zoningStatus === SearchStatus.LOADING}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default PropertyResearch;
