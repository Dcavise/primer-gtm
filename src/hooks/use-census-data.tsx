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
      console.log("Fetching census data for address:", address);

      // Use mock data in developer mode
      if (isDeveloperMode) {
        console.log("[DEV MODE] Using mock census data");

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

        setCensusData(mockData);
        setSearchedAddress(address);
        setIsMockData(true);
        setStatus("success");

        toast.success("Census data retrieved (MOCK)", {
          description: "Using mock census data for development",
        });

        return;
      }

      // Real data fetching for non-developer mode
      const { data, error } = await supabase.functions.invoke("census-data", {
        body: { address },
      });

      if (error) {
        console.error("Error fetching census data:", error);
        setStatus("error");
        toast.error("Error retrieving census data", {
          description: error.message || "Please try again later",
        });
        return;
      }

      if (data) {
        console.log("Census data received:", data);
        setCensusData(data.data);
        setSearchedAddress(data.searchedAddress || address);
        setIsMockData(data.isMockData || false);
        setStatus("success");

        if (data.isMockData) {
          toast.warning("Using estimated census data", {
            description: data.error || "Unable to find precise data for this location",
          });
        } else {
          const tractsMessage = data.tractsIncluded
            ? `Including ${data.tractsIncluded} census tracts`
            : "";
          const blocksMessage = data.blockGroupsIncluded
            ? `${data.blockGroupsIncluded} block groups`
            : "";
          const radiusMessage = data.radiusMiles ? `${data.radiusMiles} mile radius` : "";

          const details = [tractsMessage, blocksMessage, radiusMessage]
            .filter((msg) => msg.length > 0)
            .join(", ");

          toast.success("Census data retrieved", {
            description: details ? `Data covers ${details}` : "Based on the provided address",
          });
        }
      }
    } catch (err) {
      console.error("Unexpected error fetching census data:", err);
      setStatus("error");
      toast.error("Error retrieving census data", {
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
