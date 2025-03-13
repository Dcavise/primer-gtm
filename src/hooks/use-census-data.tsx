import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase-client";
import { toast } from "sonner";
import { useDeveloperMode } from "@/contexts/DeveloperModeContext";
import { mockCensusData } from "@/utils/mockData";

export type CensusCategory = {
  name: string;
  value: string;
};

export type CensusData = {
  totalPopulation: number;
  medianHouseholdIncome: number;
  medianHomeValue: number;
  educationLevelHS: number;
  educationLevelBachelor: number;
  unemploymentRate: number;
  povertyRate: number;
  medianAge: number;
  categories: {
    demographic: CensusCategory[];
    economic: CensusCategory[];
    housing: CensusCategory[];
    education: CensusCategory[];
  };
};

export type CensusStatus = "idle" | "loading" | "success" | "error";

export const useCensusData = () => {
  const [censusData, setCensusData] = useState<CensusData | null>(null);
  const [status, setStatus] = useState<CensusStatus>("idle");
  const [searchedAddress, setSearchedAddress] = useState("");
  const [isMockData, setIsMockData] = useState(false);
  const { isDeveloperMode } = useDeveloperMode();

  // Listen for developer mode changes
  useEffect(() => {
    const handleDevModeChange = () => {
      // Reset data when developer mode changes
      reset();
    };

    window.addEventListener("developer-mode-changed", handleDevModeChange);
    return () => window.removeEventListener("developer-mode-changed", handleDevModeChange);
  }, []);

  const fetchCensusData = async (address: string) => {
    try {
      setStatus("loading");
      console.log("[MOCK] Fetching census data for address:", address);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Transform mock data to match CensusData type
      const mockData: CensusData = {
        totalPopulation: mockCensusData.demographics.totalPopulation,
        medianHouseholdIncome: mockCensusData.economics.medianHouseholdIncome,
        medianHomeValue: mockCensusData.housing.medianHomeValue,
        educationLevelHS: mockCensusData.economics.educationLevels.highSchoolOrLess,
        educationLevelBachelor: mockCensusData.economics.educationLevels.bachelors,
        unemploymentRate: mockCensusData.economics.unemploymentRate,
        povertyRate: mockCensusData.economics.povertyRate,
        medianAge: mockCensusData.demographics.medianAge,
        categories: {
          demographic: [
            {
              name: "Under 18",
              value: `${mockCensusData.demographics.ageDistribution.under18}%`,
            },
            {
              name: "18-24",
              value: `${mockCensusData.demographics.ageDistribution.age18to24}%`,
            },
            {
              name: "25-44",
              value: `${mockCensusData.demographics.ageDistribution.age25to44}%`,
            },
            {
              name: "45-64",
              value: `${mockCensusData.demographics.ageDistribution.age45to64}%`,
            },
            {
              name: "65+",
              value: `${mockCensusData.demographics.ageDistribution.age65plus}%`,
            },
          ],
          economic: [
            {
              name: "Median Household Income",
              value: `$${mockCensusData.economics.medianHouseholdIncome.toLocaleString()}`,
            },
            {
              name: "Poverty Rate",
              value: `${mockCensusData.economics.povertyRate}%`,
            },
            {
              name: "Unemployment Rate",
              value: `${mockCensusData.economics.unemploymentRate}%`,
            },
          ],
          housing: [
            {
              name: "Total Housing Units",
              value: mockCensusData.housing.totalHousingUnits.toLocaleString(),
            },
            {
              name: "Occupancy Rate",
              value: `${mockCensusData.housing.occupancyRate}%`,
            },
            {
              name: "Owner Occupied",
              value: `${mockCensusData.housing.ownerOccupied}%`,
            },
            {
              name: "Renter Occupied",
              value: `${mockCensusData.housing.renterOccupied}%`,
            },
            {
              name: "Median Home Value",
              value: `$${mockCensusData.housing.medianHomeValue.toLocaleString()}`,
            },
            {
              name: "Median Rent",
              value: `$${mockCensusData.housing.medianRent}`,
            },
          ],
          education: [
            {
              name: "High School or Less",
              value: `${mockCensusData.economics.educationLevels.highSchoolOrLess}%`,
            },
            {
              name: "Some College",
              value: `${mockCensusData.economics.educationLevels.someCollege}%`,
            },
            {
              name: "Bachelor's Degree",
              value: `${mockCensusData.economics.educationLevels.bachelors}%`,
            },
            {
              name: "Graduate Degree",
              value: `${mockCensusData.economics.educationLevels.graduate}%`,
            },
          ],
        },
      };

      // Slightly vary the data based on address to make it seem location-specific
      // Calculate a simple hash from the address to use for data variation
      const addressHash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const variationPercentage = (addressHash % 20) / 100; // 0-20% variation

      // Apply small variations to numeric values
      mockData.totalPopulation = Math.round(mockData.totalPopulation * (1 + variationPercentage));
      mockData.medianHouseholdIncome = Math.round(mockData.medianHouseholdIncome * (1 + variationPercentage));
      mockData.medianHomeValue = Math.round(mockData.medianHomeValue * (1 + variationPercentage));
      
      // Set the data in state
      setCensusData(mockData);
      setSearchedAddress(address);
      setIsMockData(true);
      setStatus("success");

      // Show a toast notification about mock data
      toast.info("Using demographic estimates", {
        description: "External census API is unavailable - using estimated data",
      });
      
    } catch (err) {
      console.error("[MOCK] Error processing census data:", err);
      setStatus("error");
      toast.error("Error retrieving demographic data", {
        description: "An unexpected error occurred, please try again",
      });
    }
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
    fetchCensusData,
    reset,
  };
};
