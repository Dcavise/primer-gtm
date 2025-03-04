
import { useState } from "react";
import { CensusData, CensusResponse, SearchStatus } from "@/types";
import { toast } from "sonner";
import { getMockCensusData } from "@/services/census-api";
import { geocodeAddress } from "@/utils/geocoding";
import { supabase } from "@/integrations/supabase/client";

export function useCensusData() {
  const [censusData, setCensusData] = useState<CensusData | null>(null);
  const [censusResponse, setCensusResponse] = useState<CensusResponse | null>(null);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [searchedAddress, setSearchedAddress] = useState<string>("");
  const [isMockData, setIsMockData] = useState<boolean>(false);

  const fetchDataForAddress = async (address: string) => {
    setStatus("loading");
    setIsMockData(false);
    console.log("Fetching census data for address:", address);
    
    try {
      // First geocode the address to get coordinates
      const geocodeResult = await geocodeAddress(address.trim());
      
      if (!geocodeResult) {
        console.error("Geocoding failed for address:", address);
        setStatus("error");
        toast.error("Could not find location coordinates", {
          description: "Please check the address and try again"
        });
        return;
      }
      
      console.log("Geocode result:", geocodeResult);
      
      // Use the formatted address from geocoding
      const formattedAddress = geocodeResult.address;
      setSearchedAddress(formattedAddress);
      
      // Now fetch census data using the coordinates
      const { lat, lng } = geocodeResult.coordinates;
      console.log(`Fetching census data for coordinates: ${lat}, ${lng}`);
      
      // Call the Supabase Edge Function with debugging timestamp
      const requestTime = new Date().toISOString();
      console.log(`Making request to census-data edge function at ${requestTime}`);
      
      const { data: response, error } = await supabase.functions.invoke('census-data', {
        body: { lat, lng, address: formattedAddress }
      });
      
      if (error) {
        console.error("Error calling census-data function:", error);
        setStatus("error");
        setCensusData(null);
        setCensusResponse(null);
        toast.error("Census data not available", {
          description: "We couldn't find census data for this location."
        });
        return;
      }
      
      if (!response || !response.data) {
        console.error("No census data returned for coordinates:", { lat, lng });
        setStatus("error");
        setCensusData(null);
        setCensusResponse(null);
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
      
      // Show different toast based on whether it's mock data and tracts found
      if (response.tractsIncluded === 0 || response.isMockData) {
        toast.info("Using demo census data", {
          description: "No census tracts found within 5 miles. Showing sample data for demonstration."
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
      toast.error("Error retrieving census data", {
        description: "There was a problem connecting to the census database. Please try again later."
      });
    }
  };

  const loadMockData = () => {
    setStatus("loading");
    
    // Short timeout to show loading state
    setTimeout(() => {
      const mockData = getMockCensusData();
      setCensusData(mockData);
      setCensusResponse({
        data: mockData,
        tractsIncluded: 5,
        radiusMiles: 5
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
  };

  return {
    censusData,
    censusResponse,
    status,
    searchedAddress,
    isMockData,
    fetchCensusData: fetchDataForAddress,
    loadMockData,
    reset
  };
}
