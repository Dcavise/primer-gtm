
import { PermitResponse, PermitSearchParams } from "@/types";
import { toast } from "sonner";
import { CensusData, CensusDataItem } from "@/hooks/use-census-data";

const API_KEY = "9287beef057a695d64806257059567fbee26524d";
const API_BASE_URL = "https://api.zoneomics.com/v2";
const CENSUS_API_KEY = "9cc42f8030aeecf163f664dde9ad2167f9a41a5b";

export async function searchPermits(params: PermitSearchParams): Promise<PermitResponse> {
  try {
    const queryParams = new URLSearchParams({
      api_key: API_KEY,
      bottom_left_lat: params.bottom_left_lat.toString(),
      bottom_left_lng: params.bottom_left_lng.toString(),
      top_right_lat: params.top_right_lat.toString(),
      top_right_lng: params.top_right_lng.toString()
    });

    const response = await fetch(`${API_BASE_URL}/zonePermits?${queryParams}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch permits");
    }

    const data = await response.json();
    return {
      permits: data.data || [],
      total: data.data?.length || 0
    };
  } catch (error) {
    console.error("Error fetching permits:", error);
    toast.error("Failed to fetch permit data. Please try again.");
    throw error;
  }
}

export async function fetchZoneDetails(params: {
  lat?: number;
  lng?: number;
  address?: string;
  output_fields?: string;
  group_plu?: string;
  replace_STF?: boolean;
}) {
  try {
    const queryParams = new URLSearchParams({
      api_key: API_KEY,
    });

    if (params.lat && params.lng) {
      queryParams.append("lat", params.lat.toString());
      queryParams.append("lng", params.lng.toString());
    }

    if (params.address) {
      queryParams.append("address", params.address);
    }

    if (params.output_fields) {
      queryParams.append("output_fields", params.output_fields);
    }

    if (params.group_plu) {
      queryParams.append("group_plu", params.group_plu);
    }

    if (params.replace_STF !== undefined) {
      queryParams.append("replace_STF", params.replace_STF.toString());
    }

    console.log("Fetching zoning details with params:", queryParams.toString());
    const response = await fetch(`${API_BASE_URL}/zoneDetail?${queryParams}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch zoning details");
    }

    const data = await response.json();
    console.log("Zoning API response:", data);
    
    if (!data || typeof data.success !== 'boolean') {
      throw new Error("Invalid or incomplete response from zoning API");
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching zoning details:", error);
    toast.error("Failed to fetch zoning data. Please try again.");
    throw error;
  }
}

// Census API Integration
export async function fetchCensusData(params: { lat: number, lng: number }): Promise<CensusData | null> {
  try {
    // Step 1: Get the Census Block GEOID for the coordinates using the Geocoding API
    const geoUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${params.lng}&y=${params.lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=14&format=json`;
    
    console.log("Fetching Census GEOID for coordinates:", params);
    const geoResponse = await fetch(geoUrl);
    
    if (!geoResponse.ok) {
      throw new Error("Failed to geocode location to census geography");
    }
    
    const geoData = await geoResponse.json();
    console.log("Census geocoding response:", geoData);
    
    // Check if we have valid geographies data
    if (!geoData.result?.geographies) {
      toast.error("Location not found in Census database");
      return null;
    }
    
    // Get tract ID from the geocoded result
    const tractInfo = geoData.result.geographies["Census Tracts"][0];
    const tractId = tractInfo.TRACT;
    const stateId = tractInfo.STATE;
    const countyId = tractInfo.COUNTY;
    
    console.log(`Found Census tract: ${tractId} in state ${stateId}, county ${countyId}`);
    
    // Step 2: Fetch American Community Survey (ACS) data for this tract
    // We'll fetch several data points from different tables:
    // - B01003: Total Population
    // - B19013: Median Household Income
    // - B25077: Median Home Value
    // - B15003: Educational Attainment
    // - B23025: Employment Status
    // - B17001: Poverty Status
    // - B25002: Housing Occupancy
    
    // Use the 5-year ACS dataset (most comprehensive)
    const censusBaseUrl = "https://api.census.gov/data/2022/acs/acs5";
    
    // Construct the geolocation filter for this tract
    const geoFilter = `state:${stateId}+county:${countyId}+tract:${tractId}`;
    
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
    
    // Fetch demographic data
    console.log("Fetching demographic census data...");
    const demographicUrl = `${censusBaseUrl}?get=${demographicVars}&for=tract:${tractId}&in=state:${stateId}%20county:${countyId}&key=${CENSUS_API_KEY}`;
    const demographicResponse = await fetch(demographicUrl);
    if (!demographicResponse.ok) {
      throw new Error("Failed to fetch demographic census data");
    }
    const demographicData = await demographicResponse.json();
    
    // Fetch economic data
    console.log("Fetching economic census data...");
    const economicUrl = `${censusBaseUrl}?get=${economicVars}&for=tract:${tractId}&in=state:${stateId}%20county:${countyId}&key=${CENSUS_API_KEY}`;
    const economicResponse = await fetch(economicUrl);
    if (!economicResponse.ok) {
      throw new Error("Failed to fetch economic census data");
    }
    const economicData = await economicResponse.json();
    
    // Fetch housing data
    console.log("Fetching housing census data...");
    const housingUrl = `${censusBaseUrl}?get=${housingVars}&for=tract:${tractId}&in=state:${stateId}%20county:${countyId}&key=${CENSUS_API_KEY}`;
    const housingResponse = await fetch(housingUrl);
    if (!housingResponse.ok) {
      throw new Error("Failed to fetch housing census data");
    }
    const housingData = await housingResponse.json();
    
    // Fetch education data
    console.log("Fetching education census data...");
    const educationUrl = `${censusBaseUrl}?get=${educationVars}&for=tract:${tractId}&in=state:${stateId}%20county:${countyId}&key=${CENSUS_API_KEY}`;
    const educationResponse = await fetch(educationUrl);
    if (!educationResponse.ok) {
      throw new Error("Failed to fetch education census data");
    }
    const educationData = await educationResponse.json();
    
    console.log("All census data fetched successfully!");
    
    // Process the raw data
    const rawData = {
      demographic: processApiData(demographicData),
      economic: processApiData(economicData),
      housing: processApiData(housingData),
      education: processApiData(educationData)
    };
    
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
  } catch (error) {
    console.error("Error fetching census data:", error);
    toast.error("Failed to retrieve census data. Please try again.");
    return null;
  }
}

// Helper function to convert census API response to an object
function processApiData(apiData: any[]): Record<string, string> {
  if (!apiData || apiData.length < 2) {
    return {};
  }
  
  const headers = apiData[0];
  const values = apiData[1];
  const result: Record<string, string> = {};
  
  headers.forEach((header: string, index: number) => {
    result[header] = values[index];
  });
  
  return result;
}

export async function testMiamiAddress(): Promise<PermitResponse | null> {
  try {
    const miamiParams: PermitSearchParams = {
      bottom_left_lat: 25.7619,
      bottom_left_lng: -80.19,
      top_right_lat: 25.7903,
      top_right_lng: -80.13
    };
    
    console.log("Testing Miami address with coordinates:", miamiParams);
    const result = await searchPermits(miamiParams);
    console.log("API Test Result:", {
      total: result.total,
      samplePermits: result.permits.slice(0, 3)
    });
    
    return result;
  } catch (error) {
    console.error("Miami test failed:", error);
    return null;
  }
}

export async function testExactAddressMatch(): Promise<{permits: PermitResponse | null, address: string}> {
  const exactMatchAddress = "1601 Washington Ave, Miami Beach, FL 33139";
  
  try {
    const params: PermitSearchParams = {
      bottom_left_lat: 25.7850,
      bottom_left_lng: -80.1350,
      top_right_lat: 25.7900,
      top_right_lng: -80.1280
    };
    
    console.log("Testing exact address match with coordinates:", params);
    console.log("Test address:", exactMatchAddress);
    
    const result = await searchPermits(params);
    console.log("Exact Address Test Result:", {
      total: result.total,
      samplePermits: result.permits.slice(0, 3)
    });
    
    const exactMatches = result.permits.filter(permit => {
      return permit.address && 
             permit.address.toLowerCase().includes("1601") &&
             permit.address.toLowerCase().includes("washington");
    });
    
    console.log(`Found ${exactMatches.length} exact matches for the test address`);
    
    return {
      permits: {
        permits: result.permits,
        total: result.permits.length
      },
      address: exactMatchAddress
    };
  } catch (error) {
    console.error("Exact address test failed:", error);
    return {
      permits: null,
      address: exactMatchAddress
    };
  }
}
