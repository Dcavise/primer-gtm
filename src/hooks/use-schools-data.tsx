import { useState, useEffect } from "react";
import { School, SchoolsResponse } from "@/types/schools";
import { SearchStatus } from "@/types";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase-client';
import { useDeveloperMode } from '@/contexts/DeveloperModeContext';
import { mockSchools } from '@/utils/mockData';

export function useSchoolsData() {
  const [schools, setSchools] = useState<School[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [searchedAddress, setSearchedAddress] = useState<string>("");
  const [searchResponse, setSearchResponse] = useState<SchoolsResponse | null>(null);
  const { isDeveloperMode } = useDeveloperMode();

  // Listen for developer mode changes
  useEffect(() => {
    const handleDevModeChange = () => {
      // Reset data when developer mode changes
      reset();
    };
    
    window.addEventListener('developer-mode-changed', handleDevModeChange);
    return () => window.removeEventListener('developer-mode-changed', handleDevModeChange);
  }, []);

  const fetchSchoolsData = async (params: { lat: number, lon: number }, address: string) => {
    setStatus("loading");
    console.log(`Fetching schools data for address: ${address}, coordinates: (${params.lat}, ${params.lon})`);
    
    // Use mock data in developer mode
    if (isDeveloperMode) {
      console.log("[DEV MODE] Using mock schools data");
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockResponse: SchoolsResponse = {
        searchedAddress: address,
        coordinates: {
          lat: params.lat,
          lon: params.lon
        },
        radiusMiles: 5,
        totalResults: mockSchools.length,
        schools: mockSchools
      };
      
      setSchools(mockSchools);
      setSearchResponse(mockResponse);
      setStatus("success");
      setSearchedAddress(address);
      
      toast.success("Schools data retrieved (MOCK)", {
        description: `Found ${mockSchools.length} schools within 5 miles.`
      });
      
      return;
    }
    
    // Real data fetching for non-developer mode
    try {
      const { data: response, error } = await supabase.functions.invoke('nearby-schools', {
        body: { 
          address, 
          lat: params.lat, 
          lon: params.lon, 
          radius: 5 
        }
      });
      
      if (error) {
        console.error("Error calling nearby-schools function:", error);
        setStatus("error");
        setSchools([]);
        setSearchResponse(null);
        toast.error("Error retrieving schools data", {
          description: `${error.message || "We couldn't connect to the schools database."}`
        });
        return;
      }
      
      if (!response || !response.schools) {
        console.error("No schools data returned for address:", address);
        setStatus("error");
        setSchools([]);
        setSearchResponse(null);
        toast.error("Schools data not available", {
          description: "We couldn't find school data for this location."
        });
        return;
      }
      
      console.log(`Received ${response.schools.length} schools for ${address}`);
      setSchools(response.schools);
      setSearchResponse(response as SchoolsResponse);
      setStatus("success");
      setSearchedAddress(response.searchedAddress || address);
      
      if (response.schools.length === 0) {
        toast.info("No schools found", {
          description: `No schools found within ${response.radiusMiles} miles of this location.`
        });
      } else {
        toast.success("Schools data retrieved", {
          description: `Found ${response.schools.length} schools within ${response.radiusMiles} miles.`
        });
      }
    } catch (error) {
      console.error("Error in useSchoolsData:", error);
      setStatus("error");
      setSchools([]);
      setSearchResponse(null);
      toast.error("Error retrieving schools data", {
        description: "There was a problem connecting to the schools database. Please try again later."
      });
    }
  };

  const reset = () => {
    setSchools([]);
    setStatus("idle");
    setSearchedAddress("");
    setSearchResponse(null);
  };

  return {
    schools,
    searchResponse,
    status,
    searchedAddress,
    fetchSchoolsData,
    reset
  };
}
