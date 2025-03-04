
import { toast } from "sonner";
import { CENSUS_API_KEY } from "./api-config";
import { CensusData, CensusDataItem } from "@/hooks/use-census-data";

// Census API Integration
export async function fetchCensusData(params: { lat: number, lng: number }): Promise<CensusData | null> {
  try {
    console.log("Starting fetchCensusData with params:", params);
    
    // Step 1: Get the Census Block GEOID for the coordinates using the Geocoding API
    const geoUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${params.lng}&y=${params.lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=14&format=json`;
    
    console.log("Fetching Census GEOID for coordinates with URL:", geoUrl);
    const geoResponse = await fetch(geoUrl);
    
    if (!geoResponse.ok) {
      console.error("Census geocoding failed with status:", geoResponse.status);
      console.error("Census geocoding response text:", await geoResponse.text());
      throw new Error("Failed to geocode location to census geography");
    }
    
    const geoData = await geoResponse.json();
    console.log("Census geocoding response:", geoData);
    
    // Check if we have valid geographies data
    if (!geoData.result?.geographies || 
        !geoData.result?.geographies["Census Tracts"] || 
        !geoData.result?.geographies["Census Tracts"][0]) {
      console.error("Invalid or missing geographies data in Census response:", geoData);
      toast.error("Location not found in Census database");
      return null;
    }
    
    // Get tract ID from the geocoded result
    const tractInfo = geoData.result.geographies["Census Tracts"][0];
    const tractId = tractInfo.TRACT;
    const stateId = tractInfo.STATE;
    const countyId = tractInfo.COUNTY;
    
    console.log(`Found Census tract: ${tractId} in state ${stateId}, county ${countyId}`);
    
    const censusData = await fetchCensusDataByTract(tractId, stateId, countyId);
    return censusData;
  } catch (error) {
    console.error("Error fetching census data:", error);
    toast.error("Failed to retrieve census data. Please try again.");
    return null;
  }
}

async function fetchCensusDataByTract(
  tractId: string, 
  stateId: string, 
  countyId: string
): Promise<CensusData | null> {
  try {
    // Use the 5-year ACS dataset (most comprehensive)
    const censusBaseUrl = "https://api.census.gov/data/2022/acs/acs5";
    
    // Construct variables to request (multiple tables at once)
    const demographicVars = [
      "B01003_001E", // Total population
      "B01002_001E", // Median age
      "B02001_002E", // White population
      "B02001_003E", // Black population
      "B02001_004E", // American Indian and Alaska Native
      "B02001_005E", // Asian population
      "B03003_003E"  // Hispanic or Latino population
    ].join(",");
    
    const economicVars = [
      "B19013_001E", // Median household income
      "B19001_001E", // Total households for income
      "B23025_002E", // Total labor force
      "B23025_005E", // Unemployed
      "B17001_002E"  // Total population for poverty status
    ].join(",");
    
    const housingVars = [
      "B25077_001E", // Median home value
      "B25002_001E", // Total housing units
      "B25002_002E", // Occupied housing units
      "B25003_002E", // Owner-occupied units
      "B25003_003E"  // Renter-occupied units
    ].join(",");
    
    const educationVars = [
      "B15003_001E", // Total population 25 years and over
      "B15003_017E", // High school graduate
      "B15003_022E", // Bachelor's degree
      "B15003_023E", // Master's degree
      "B15003_024E", // Professional school degree
      "B15003_025E"  // Doctorate degree
    ].join(",");
    
    // Fetch all data in parallel
    const [demographicData, economicData, housingData, educationData] = await Promise.all([
      fetchCensusVariables(censusBaseUrl, demographicVars, tractId, stateId, countyId, "demographic"),
      fetchCensusVariables(censusBaseUrl, economicVars, tractId, stateId, countyId, "economic"),
      fetchCensusVariables(censusBaseUrl, housingVars, tractId, stateId, countyId, "housing"),
      fetchCensusVariables(censusBaseUrl, educationVars, tractId, stateId, countyId, "education")
    ]);
    
    console.log("All census data fetched successfully!");
    
    // Process the raw data
    const rawData = {
      demographic: processApiData(demographicData),
      economic: processApiData(economicData),
      housing: processApiData(housingData),
      education: processApiData(educationData)
    };
    
    console.log("Processed raw data:", rawData);
    
    return processCensusData(rawData);
  } catch (error) {
    console.error("Error fetching census data by tract:", error);
    throw error;
  }
}

async function fetchCensusVariables(
  baseUrl: string, 
  variables: string, 
  tractId: string, 
  stateId: string, 
  countyId: string,
  category: string
): Promise<any[]> {
  console.log(`Fetching ${category} census data...`);
  const url = `${baseUrl}?get=${variables}&for=tract:${tractId}&in=state:${stateId}%20county:${countyId}&key=${CENSUS_API_KEY}`;
  console.log(`${category.charAt(0).toUpperCase() + category.slice(1)} URL:`, url);
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch ${category} data:`, await response.text());
    throw new Error(`Failed to fetch ${category} census data`);
  }
  
  const data = await response.json();
  console.log(`${category.charAt(0).toUpperCase() + category.slice(1)} data:`, data);
  return data;
}

// Helper function to convert census API response to an object
export function processApiData(apiData: any[]): Record<string, string> {
  if (!apiData || apiData.length < 2) {
    console.error("Invalid API data format:", apiData);
    return {};
  }
  
  const headers = apiData[0];
  const values = apiData[1];
  const result: Record<string, string> = {};
  
  headers.forEach((header: string, index: number) => {
    result[header] = values[index];
  });
  
  console.log("Processed API data:", result);
  return result;
}

function processCensusData(rawData: {
  demographic: Record<string, string>;
  economic: Record<string, string>;
  housing: Record<string, string>;
  education: Record<string, string>;
}): CensusData {
  // Extract key statistics
  const totalPopulation = parseInt(rawData.demographic["B01003_001E"]) || 0;
  const medianHouseholdIncome = parseInt(rawData.economic["B19013_001E"]) || 0;
  const medianHomeValue = parseInt(rawData.housing["B25077_001E"]) || 0;
  
  const totalEducationPop = parseInt(rawData.education["B15003_001E"]) || 1;
  const hsGrads = parseInt(rawData.education["B15003_017E"]) || 0;
  const bachelors = parseInt(rawData.education["B15003_022E"]) || 0;
  const masters = parseInt(rawData.education["B15003_023E"]) || 0;
  const professional = parseInt(rawData.education["B15003_024E"]) || 0;
  const doctorate = parseInt(rawData.education["B15003_025E"]) || 0;
  
  const educationLevelHS = (hsGrads / totalEducationPop) * 100;
  const educationLevelBachelor = ((bachelors + masters + professional + doctorate) / totalEducationPop) * 100;
  
  // Calculate unemployment rate
  const laborForce = parseInt(rawData.economic["B23025_002E"]) || 1;
  const unemployed = parseInt(rawData.economic["B23025_005E"]) || 0;
  const unemploymentRate = (unemployed / laborForce) * 100;
  
  // Housing statistics
  const housingUnits = parseInt(rawData.housing["B25002_001E"]) || 0;
  const occupiedUnits = parseInt(rawData.housing["B25002_002E"]) || 1;
  const ownerOccupied = parseInt(rawData.housing["B25003_002E"]) || 0;
  const homeownershipRate = (ownerOccupied / occupiedUnits) * 100;
  
  // Parse racial demographics
  const whitePopulation = parseInt(rawData.demographic["B02001_002E"]) || 0;
  const blackPopulation = parseInt(rawData.demographic["B02001_003E"]) || 0;
  const asianPopulation = parseInt(rawData.demographic["B02001_005E"]) || 0;
  const hispanicPopulation = parseInt(rawData.demographic["B03003_003E"]) || 0;
  
  const medianAge = parseInt(rawData.demographic["B01002_001E"]) || 0;
  
  // Format categorized data for display
  const demographicItems: CensusDataItem[] = [
    { name: "Total Population", value: totalPopulation },
    { name: "Median Age", value: medianAge },
    { name: "White Population", value: whitePopulation, description: "Non-Hispanic White population" },
    { name: "Black Population", value: blackPopulation },
    { name: "Asian Population", value: asianPopulation },
    { name: "Hispanic Population", value: hispanicPopulation },
    { name: "White Percent", value: totalPopulation ? (whitePopulation / totalPopulation) * 100 : 0 },
    { name: "Black Percent", value: totalPopulation ? (blackPopulation / totalPopulation) * 100 : 0 },
    { name: "Asian Percent", value: totalPopulation ? (asianPopulation / totalPopulation) * 100 : 0 },
    { name: "Hispanic Percent", value: totalPopulation ? (hispanicPopulation / totalPopulation) * 100 : 0 }
  ];
  
  const economicItems: CensusDataItem[] = [
    { name: "Median Household Income", value: medianHouseholdIncome },
    { name: "Unemployment Rate", value: unemploymentRate },
    { name: "Labor Force", value: laborForce },
    { name: "Unemployed", value: unemployed }
  ];
  
  const housingItems: CensusDataItem[] = [
    { name: "Median Home Value", value: medianHomeValue },
    { name: "Total Housing Units", value: housingUnits },
    { name: "Occupied Units", value: occupiedUnits },
    { name: "Owner Occupied", value: ownerOccupied },
    { name: "Renter Occupied", value: occupiedUnits - ownerOccupied },
    { name: "Homeownership Rate", value: homeownershipRate },
    { name: "Vacancy Rate", value: housingUnits ? ((housingUnits - occupiedUnits) / housingUnits) * 100 : 0 }
  ];
  
  const educationItems: CensusDataItem[] = [
    { name: "High School Graduate", value: educationLevelHS, description: "Percentage with high school diploma or higher" },
    { name: "Bachelor's Degree or Higher", value: educationLevelBachelor, description: "Percentage with a bachelor's degree or higher" },
    { name: "Graduate or Professional Degree", value: ((masters + professional + doctorate) / totalEducationPop) * 100 }
  ];
  
  // Return formatted census data
  return {
    totalPopulation,
    medianHouseholdIncome,
    medianHomeValue,
    educationLevelHS,
    educationLevelBachelor,
    unemploymentRate,
    medianAge,
    housingUnits,
    homeownershipRate,
    rawData: {
      ...rawData.demographic,
      ...rawData.economic,
      ...rawData.housing,
      ...rawData.education
    },
    categories: {
      demographic: demographicItems,
      economic: economicItems,
      housing: housingItems,
      education: educationItems
    }
  };
}
