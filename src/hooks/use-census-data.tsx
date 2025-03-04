
import { useState } from "react";
import { SearchStatus } from "@/types";
import { toast } from "sonner";
import { fetchCensusData } from "@/services/api";
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

  const fetchDataForAddress = async (address: string) => {
    setStatus("loading");
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
        throw new Error("Failed to fetch census data");
      }
      
      console.log("Census data received:", result);
      setCensusData(result);
      setStatus("success");
      
      toast.success("Census data retrieved", {
        description: "Showing demographic information for the specified location."
      });
    } catch (error) {
      console.error("Error in useCensusData:", error);
      setStatus("error");
      setCensusData(null);
      toast.error("Error retrieving census data", {
        description: "There was a problem connecting to the census database. Please try again later."
      });
    }
  };

  const reset = () => {
    setCensusData(null);
    setStatus("idle");
    setSearchedAddress("");
  };

  return {
    censusData,
    status,
    searchedAddress,
    fetchCensusData: fetchDataForAddress,
    reset
  };
}
