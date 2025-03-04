
import { useState } from "react";
import { SearchStatus } from "@/types";
import { toast } from "sonner";
import { fetchCensusData, getMockCensusData } from "@/services/census-api";
import { geocodeAddress } from "@/utils/geocoding";

export interface CensusDataItem {
  name: string;
  value: string | number;
  description?: string;
}

export interface CensusData {
  totalPopulation?: number;
  medianHouseholdIncome?: number;
  medianHomeValue?: number;
  educationLevelHS?: number;
  educationLevelBachelor?: number;
  unemploymentRate?: number;
  povertyRate?: number;
  medianAge?: number;
  housingUnits?: number;
  homeownershipRate?: number;
  rawData: Record<string, any>;
  categories: {
    demographic: CensusDataItem[];
    economic: CensusDataItem[];
    housing: CensusDataItem[];
    education: CensusDataItem[];
  };
}

export function useCensusData() {
  const [censusData, setCensusData] = useState<CensusData | null>(null);
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
      
      const result = await fetchCensusData({ lat, lng });
      
      if (!result) {
        console.error("No census data returned for coordinates:", { lat, lng });
        setStatus("error");
        setCensusData(null);
        toast.error("Census data not available", {
          description: "We couldn't find census data for this location."
        });
        return;
      }
      
      console.log("Census data received:", result);
      setCensusData(result);
      setStatus("success");
      
      // Show different toast based on whether it's mock data
      if (result.totalPopulation === 4287) { // This is a simple check for mock data
        setIsMockData(true);
        toast.info("Using demo census data", {
          description: "The Census API could not be reached. Showing sample data for demonstration."
        });
      } else {
        toast.success("Census data retrieved", {
          description: "Showing demographic information for the specified location."
        });
      }
    } catch (error) {
      console.error("Error in useCensusData:", error);
      setStatus("error");
      setCensusData(null);
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
      setStatus("success");
      setIsMockData(true);
      
      toast.success("Demo data loaded", {
        description: "Showing sample census data for demonstration purposes."
      });
    }, 500);
  };

  const reset = () => {
    setCensusData(null);
    setStatus("idle");
    setSearchedAddress("");
    setIsMockData(false);
  };

  return {
    censusData,
    status,
    searchedAddress,
    isMockData,
    fetchCensusData: fetchDataForAddress,
    loadMockData,
    reset
  };
}
