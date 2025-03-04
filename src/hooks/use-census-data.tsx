
import { useState } from "react";
import { CensusData, CensusResponse, SearchStatus } from "@/types";
import { toast } from "sonner";
import { getMockCensusData } from "@/services/census-api";
import { supabase } from "@/integrations/supabase/client";

export function useCensusData() {
  const [censusData, setCensusData] = useState<CensusData | null>(null);
  const [censusResponse, setCensusResponse] = useState<CensusResponse | null>(null);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [searchedAddress, setSearchedAddress] = useState<string>("");
  const [isMockData, setIsMockData] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const fetchDataForAddress = async (address: string) => {
    setStatus("loading");
    setIsMockData(false);
    setErrorDetails(null);
    console.log("Fetching census data for address:", address);
    
    try {
      // Call the Supabase Edge Function with the address directly
      const requestTime = new Date().toISOString();
      console.log(`Making request to census-data edge function at ${requestTime}`);
      
      const { data: response, error } = await supabase.functions.invoke('census-data', {
        body: { address: address.trim() }
      });
      
      if (error) {
        console.error("Error calling census-data function:", error);
        setStatus("error");
        setCensusData(null);
        setCensusResponse(null);
        setErrorDetails(error.message || "Connection error");
        toast.error("Census data not available", {
          description: `Error: ${error.message || "We couldn't connect to the census database."}`
        });
        return;
      }
      
      if (!response || !response.data) {
        console.error("No census data returned for address:", address);
        setStatus("error");
        setCensusData(null);
        setCensusResponse(null);
        setErrorDetails("No data returned");
        toast.error("Census data not available", {
          description: "We couldn't find census data for this location."
        });
        return;
      }
      
      console.log("Census data received:", response);
      setCensusData(response.data);
      setCensusResponse({
        data: response.data,
        tractsIncluded: response.tractsIncluded,
        radiusMiles: response.radiusMiles
      });
      setStatus("success");
      setIsMockData(response.isMockData);
      setSearchedAddress(response.searchedAddress || address);
      
      // Show different toast based on whether it's mock data and tracts found
      if (response.isMockData) {
        toast.info("Using demo census data", {
          description: response.error 
            ? `${response.error}. Showing sample data for demonstration.`
            : "No census tracts found within 2 miles. Showing sample data for demonstration."
        });
      } else if (response.tractsIncluded === 0) {
        toast.warning("Limited census data", {
          description: "No census tracts found within search radius. Data may be less accurate."
        });
      } else {
        toast.success("Census data retrieved", {
          description: `Showing demographic data from ${response.tractsIncluded} census tracts within ${response.radiusMiles} miles.`
        });
      }
    } catch (error) {
      console.error("Error in useCensusData:", error);
      setStatus("error");
      setCensusData(null);
      setCensusResponse(null);
      setErrorDetails(error instanceof Error ? error.message : "Unknown error");
      toast.error("Error retrieving census data", {
        description: "There was a problem connecting to the census database. Please try again later."
      });
    }
  };

  const loadMockData = () => {
    setStatus("loading");
    setErrorDetails(null);
    
    // Short timeout to show loading state
    setTimeout(() => {
      const mockData = getMockCensusData();
      setCensusData(mockData);
      setCensusResponse({
        data: mockData,
        tractsIncluded: 5,
        radiusMiles: 2
      });
      setStatus("success");
      setIsMockData(true);
      setSearchedAddress("Sample Location");
      
      toast.success("Demo data loaded", {
        description: "Showing sample census data for demonstration purposes."
      });
    }, 500);
  };

  const reset = () => {
    setCensusData(null);
    setCensusResponse(null);
    setStatus("idle");
    setSearchedAddress("");
    setIsMockData(false);
    setErrorDetails(null);
  };

  return {
    censusData,
    censusResponse,
    status,
    searchedAddress,
    isMockData,
    errorDetails,
    fetchCensusData: fetchDataForAddress,
    loadMockData,
    reset
  };
}
