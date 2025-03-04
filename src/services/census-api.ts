import { CensusData, Coordinates } from "@/types";
import { toast } from "sonner";
import { getApiKey } from "./api-config";

// Mock data for testing purposes
export const getMockCensusData = (): CensusData => ({
  categories: {
    demographic: [
      { label: "Population", value: "10000" },
      { label: "Median Age", value: "35" },
    ],
    economic: [
      { label: "Median Household Income", value: "$60,000" },
      { label: "Unemployment Rate", value: "5%" },
    ],
    housing: [
      { label: "Median Home Value", value: "$250,000" },
      { label: "Homeownership Rate", value: "60%" },
    ],
    education: [
      { label: "Bachelor's Degree or Higher", value: "30%" },
      { label: "High School Graduate or Higher", value: "90%" },
    ],
  },
  location: {
    address: "Sample Location",
    latitude: 34.0522,
    longitude: -118.2437,
  },
});

export async function fetchCensusData({ lat, lng }: Coordinates): Promise<any> {
  try {
    console.log(`Fetching census data for coordinates: ${lat}, ${lng}`);
    
    // Get the Census API key securely
    const apiKey = await getApiKey('census');
    
    const apiUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01001_001E,B01002_001E,B19013_001E,B23025_005E,B25077_001E,B25010_001E,B15003_022E,B15003_025E&for=tract:*&in=state:06&key=${apiKey}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process the census data
    const processedData: CensusData = {
      categories: {
        demographic: [
          { label: "Population", value: data[1][1] },
          { label: "Median Age", value: data[1][2] },
        ],
        economic: [
          { label: "Median Household Income", value: data[1][3] },
          { label: "Unemployment Rate", value: data[1][4] },
        ],
        housing: [
          { label: "Median Home Value", value: data[1][5] },
          { label: "Homeownership Rate", value: data[1][6] },
        ],
        education: [
          { label: "Bachelor's Degree or Higher", value: data[1][7] },
          { label: "High School Graduate or Higher", value: data[1][8] },
        ],
      },
      location: {
        address: "Fetched Coordinates",
        latitude: lat,
        longitude: lng,
      },
    };
    
    return {
      data: processedData,
      tractsIncluded: 1,
      radiusMiles: 5
    };
  } catch (error) {
    console.error("Error fetching census data:", error);
    toast.error("Failed to fetch census data", {
      description: "There was a problem connecting to the census database"
    });
    
    // Return mock data as fallback
    return {
      data: getMockCensusData(),
      tractsIncluded: 0,
      radiusMiles: 5
    };
  }
}
