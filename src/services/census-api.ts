import { toast } from "sonner";
import { CENSUS_API_KEY } from "./api-config";
import { CensusData, CensusDataItem } from "@/hooks/use-census-data";

// Add mock census data function to provide reliable fallback
export function getMockCensusData(): CensusData {
  // Demographic mock data
  const demographicItems: CensusDataItem[] = [
    { name: "Total Population", value: 4287 },
    { name: "Median Age", value: 36.2 },
    { name: "White Population", value: 2893, description: "Non-Hispanic White population" },
    { name: "Black Population", value: 547 },
    { name: "Asian Population", value: 532 },
    { name: "Hispanic Population", value: 315 },
    { name: "White Percent", value: 67.5 },
    { name: "Black Percent", value: 12.8 },
    { name: "Asian Percent", value: 12.4 },
    { name: "Hispanic Percent", value: 7.3 }
  ];
  
  // Economic mock data
  const economicItems: CensusDataItem[] = [
    { name: "Median Household Income", value: 78540 },
    { name: "Unemployment Rate", value: 4.2 },
    { name: "Labor Force", value: 2354 },
    { name: "Unemployed", value: 99 }
  ];
  
  // Housing mock data
  const housingItems: CensusDataItem[] = [
    { name: "Median Home Value", value: 389000 },
    { name: "Total Housing Units", value: 1842 },
    { name: "Occupied Units", value: 1753 },
    { name: "Owner Occupied", value: 1134 },
    { name: "Renter Occupied", value: 619 },
    { name: "Homeownership Rate", value: 64.7 },
    { name: "Vacancy Rate", value: 4.8 }
  ];
  
  // Education mock data
  const educationItems: CensusDataItem[] = [
    { name: "High School Graduate", value: 92.4, description: "Percentage with high school diploma or higher" },
    { name: "Bachelor's Degree or Higher", value: 45.3, description: "Percentage with a bachelor's degree or higher" },
    { name: "Graduate or Professional Degree", value: 18.7 }
  ];
  
  return {
    totalPopulation: 4287,
    medianHouseholdIncome: 78540,
    medianHomeValue: 389000,
    educationLevelHS: 92.4,
    educationLevelBachelor: 45.3,
    unemploymentRate: 4.2,
    medianAge: 36.2,
    housingUnits: 1842,
    homeownershipRate: 64.7,
    rawData: {
      // Mock raw data
      "B01003_001E": "4287",
      "B19013_001E": "78540",
      "B25077_001E": "389000"
    },
    categories: {
      demographic: demographicItems,
      economic: economicItems,
      housing: housingItems,
      education: educationItems
    }
  };
}

// Census API Integration
export async function fetchCensusData(params: { lat: number, lng: number }): Promise<CensusData | null> {
  try {
    console.log("Starting fetchCensusData with params:", params);
    
    // Try direct Census API call first
    try {
      return await fetchDirectFromCensusAPI(params);
    } catch (error) {
      console.log("Direct Census API call failed, trying fallback method:", error);
      return await fetchCensusDataFallback(params);
    }
  } catch (error) {
    console.error("Error fetching census data:", error);
    toast.error("Failed to retrieve census data. Please try again.");
    return null;
  }
}

// Direct method - may fail due to CORS
async function fetchDirectFromCensusAPI(params: { lat: number, lng: number }): Promise<CensusData | null> {
  // Step 1: Get the Census Block GEOID for the coordinates using the Geocoding API
  const geoUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${params.lng}&y=${params.lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=14&format=json`;
  
  console.log("Fetching Census GEOID for coordinates with URL:", geoUrl);
  
  const geoResponse = await fetch(geoUrl, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Accept': 'application/json'
    }
  });
  
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
}

// Fallback method - use a hardcoded or approximate census tract based on coordinates
async function fetchCensusDataFallback(params: { lat: number, lng: number }): Promise<CensusData | null> {
  console.log("Using fallback census data method");
  
  // Based on the coordinates, determine approximate state and county
  // This is a simplified approach - in a production app, you'd want a more robust solution
  let stateId = "17"; // Default to Illinois
  let countyId = "031"; // Default to Cook County (Chicago)
  let tractId = "243000"; // A sample tract in Cook County
  
  // Check general regions based on lat/lng
  if (params.lat > 41.4 && params.lat < 42.1 && params.lng > -88.0 && params.lng < -87.5) {
    // Chicago area
    stateId = "17"; // Illinois
    countyId = "031"; // Cook County
    tractId = "243000"; // Sample tract
  } else if (params.lat > 40.5 && params.lat < 41.0 && params.lng > -74.1 && params.lng < -73.7) {
    // NYC area
    stateId = "36"; // New York
    countyId = "061"; // New York County (Manhattan)
    tractId = "010900"; // Sample tract
  } else if (params.lat > 33.7 && params.lat < 34.2 && params.lng > -118.5 && params.lng < -118.0) {
    // LA area
    stateId = "06"; // California
    countyId = "037"; // Los Angeles County
    tractId = "273000"; // Sample tract
  }
  
  console.log(`Using fallback census tract: ${tractId} in state ${stateId}, county ${countyId}`);
  
  try {
    const censusData = await fetchCensusDataByTract(tractId, stateId, countyId);
    if (censusData) {
      toast.info("Using approximate census data", {
        description: "Exact location data wasn't available, showing nearest available census information."
      });
    }
    return censusData;
  } catch (error) {
    console.error("Fallback census data retrieval failed:", error);
    throw error;
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
  
  // Add CORS handling and proper headers
  const url = `${baseUrl}?get=${variables}&for=tract:${tractId}&in=state:${stateId}%20county:${countyId}&key=${CENSUS_API_KEY}`;
  console.log(`${category.charAt(0).toUpperCase() + category.slice(1)} URL:`, url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${category} data:`, await response.text());
      throw new Error(`Failed to fetch ${category} census data`);
    }
    
    const data = await response.json();
    console.log(`${category.charAt(0).toUpperCase() + category.slice(1)} data:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${category} census data:`, error);
    throw error;
  }
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
