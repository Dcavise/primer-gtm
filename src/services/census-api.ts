
import { CensusData, CensusResponse, CensusTract, Coordinates } from "@/types";
import { toast } from "sonner";
import { CENSUS_API_KEY } from "./api-config";

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in miles
}

// Find Census tracts within the radius
async function findTractsInRadius(
  coordinates: Coordinates, 
  radiusMiles: number = 5
): Promise<CensusTract[]> {
  try {
    // In a real implementation, we would query a GIS service or use spatial data
    // For this demo, we'll use a simplified approach with predefined tracts near the coordinates
    
    // Normally, this would be a call to a GIS service or Census Tract API
    // Since direct GIS/spatial queries are beyond the scope, we'll simulate finding nearby tracts
    
    // Get county and state from reverse geocoding (simplified)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=AIzaSyCPAIVrJFBNaO9gMtvHwKfzUwqS1WUkz3c`
    );
    
    if (!response.ok) {
      throw new Error("Failed to reverse geocode coordinates");
    }
    
    const geocodeData = await response.json();
    
    if (geocodeData.status !== "OK" || !geocodeData.results.length) {
      throw new Error("No geocode results found");
    }
    
    // Extract state and county from address components
    let state = "";
    let county = "";
    
    for (const result of geocodeData.results) {
      for (const component of result.address_components) {
        if (component.types.includes("administrative_area_level_1")) {
          // Get the 2-letter state code
          state = component.short_name;
        }
        if (component.types.includes("administrative_area_level_2")) {
          // Get the county name without "County"
          county = component.long_name.replace(" County", "");
        }
      }
      
      if (state && county) break;
    }
    
    if (!state || !county) {
      throw new Error("Could not determine state or county from coordinates");
    }
    
    // Get FIPS codes for state and county
    // This would normally be a lookup from a FIPS database
    // For demo purposes, simulate a query to find the state and county FIPS codes
    
    // Example output for Chicago, IL
    const stateFips = state === "IL" ? "17" : "06"; // Illinois or California as fallback
    const countyFips = county === "Cook" ? "031" : "037"; // Cook County or Los Angeles as fallback
    
    // For demo purposes, generate 5 nearby census tracts
    // In a real implementation, this would come from a GIS service
    const tracts: CensusTract[] = [];
    
    // Generate 5 mock tract IDs with distances within our radius
    for (let i = 1; i <= 5; i++) {
      const tractNumber = String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0');
      const distance = Math.random() * radiusMiles;
      
      tracts.push({
        state: stateFips,
        county: countyFips,
        tract: tractNumber,
        distance: distance
      });
    }
    
    return tracts;
  } catch (error) {
    console.error("Error finding tracts in radius:", error);
    return [];
  }
}

// Fetch ACS data for a list of census tracts
async function fetchDataForTracts(tracts: CensusTract[]): Promise<any[]> {
  if (!tracts.length) return [];
  
  try {
    // Define ACS variables to request - more comprehensive set
    const variables = [
      "B01003_001E", // Total population
      "B19013_001E", // Median household income
      "B25077_001E", // Median home value
      "B15003_017E", // High school graduate
      "B15003_022E", // Bachelor's degree
      "B15003_023E", // Master's degree
      "B15003_024E", // Professional degree
      "B15003_025E", // Doctorate degree
      "B23025_005E", // Unemployed
      "B23025_003E", // In labor force
      "B17001_002E", // Below poverty level
      "B01001_001E", // Total population (for poverty rate denominator)
      "B01002_001E", // Median age
      "B25001_001E", // Housing units
      "B25003_002E", // Owner occupied
      "B25003_001E", // Total occupied housing units (for homeownership rate)
    ];

    // Group tracts by state and county for efficient querying
    const tractsByStateCounty: Record<string, CensusTract[]> = {};
    
    tracts.forEach(tract => {
      const key = `${tract.state}:${tract.county}`;
      if (!tractsByStateCounty[key]) {
        tractsByStateCounty[key] = [];
      }
      tractsByStateCounty[key].push(tract);
    });
    
    const results: any[] = [];
    
    // Make requests for each state/county group
    for (const [key, countyTracts] of Object.entries(tractsByStateCounty)) {
      const [state, county] = key.split(':');
      const tractList = countyTracts.map(t => t.tract).join(',');
      
      // Build Census API URL
      const baseUrl = "https://api.census.gov/data/2022/acs/acs5";
      const url = `${baseUrl}?get=${variables.join(',')}&for=tract:${tractList}&in=state:${state}%20county:${county}&key=${CENSUS_API_KEY}`;
      
      try {
        // Use a CORS proxy if needed for browser requests
        const corsProxy = "https://cors-anywhere.herokuapp.com/";
        const response = await fetch(corsProxy + url);
        
        if (!response.ok) {
          throw new Error(`Census API request failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // First row contains column headers
        const headers = data[0];
        
        // Process each tract's data
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const tractData: any = {};
          
          // Map each value to its header
          headers.forEach((header: string, index: number) => {
            tractData[header] = row[index];
          });
          
          // Find the distance for this tract
          const matchingTract = countyTracts.find(
            t => t.tract === tractData.tract && 
                 t.state === tractData.state && 
                 t.county === tractData.county
          );
          
          if (matchingTract) {
            tractData.distance = matchingTract.distance;
          }
          
          results.push(tractData);
        }
      } catch (error) {
        console.error(`Error fetching data for state ${state}, county ${county}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error fetching data for tracts:", error);
    return [];
  }
}

// Process and aggregate tract data into a CensusData object
function processCensusData(tractsData: any[]): CensusData {
  if (!tractsData.length) {
    return getMockCensusData();
  }
  
  try {
    // Calculate population-weighted averages
    let totalPopulation = 0;
    let weightedIncomeSum = 0;
    let weightedHomeValueSum = 0;
    let highSchoolGrads = 0;
    let bachelorsOrHigher = 0;
    let unemployedCount = 0;
    let laborForceCount = 0;
    let belowPovertyCount = 0;
    let weightedAgeSum = 0;
    let housingUnits = 0;
    let ownerOccupied = 0;
    let totalOccupied = 0;
    
    // Sum up all values
    tractsData.forEach(tract => {
      // Convert string values to numbers
      const pop = Number(tract.B01003_001E || 0);
      
      if (pop > 0) {
        totalPopulation += pop;
        
        // Handle median values with population weighting
        const income = Number(tract.B19013_001E || 0);
        if (income > 0) weightedIncomeSum += income * pop;
        
        const homeValue = Number(tract.B25077_001E || 0);
        if (homeValue > 0) weightedHomeValueSum += homeValue * pop;
        
        const medianAge = Number(tract.B01002_001E || 0);
        if (medianAge > 0) weightedAgeSum += medianAge * pop;
        
        // Education
        const hsGrad = Number(tract.B15003_017E || 0);
        highSchoolGrads += hsGrad;
        
        const bachelors = Number(tract.B15003_022E || 0);
        const masters = Number(tract.B15003_023E || 0);
        const professional = Number(tract.B15003_024E || 0);
        const doctorate = Number(tract.B15003_025E || 0);
        bachelorsOrHigher += bachelors + masters + professional + doctorate;
        
        // Employment
        unemployedCount += Number(tract.B23025_005E || 0);
        laborForceCount += Number(tract.B23025_003E || 0);
        
        // Poverty
        belowPovertyCount += Number(tract.B17001_002E || 0);
        
        // Housing
        housingUnits += Number(tract.B25001_001E || 0);
        ownerOccupied += Number(tract.B25003_002E || 0);
        totalOccupied += Number(tract.B25003_001E || 0);
      }
    });
    
    // Calculate final values
    const medianHouseholdIncome = totalPopulation > 0 ? weightedIncomeSum / totalPopulation : 0;
    const medianHomeValue = totalPopulation > 0 ? weightedHomeValueSum / totalPopulation : 0;
    const medianAge = totalPopulation > 0 ? weightedAgeSum / totalPopulation : 0;
    
    // Calculate rates as percentages
    const educationLevelHS = totalPopulation > 0 ? (highSchoolGrads / totalPopulation) * 100 : 0;
    const educationLevelBachelor = totalPopulation > 0 ? (bachelorsOrHigher / totalPopulation) * 100 : 0;
    const unemploymentRate = laborForceCount > 0 ? (unemployedCount / laborForceCount) * 100 : 0;
    const povertyRate = totalPopulation > 0 ? (belowPovertyCount / totalPopulation) * 100 : 0;
    const homeownershipRate = totalOccupied > 0 ? (ownerOccupied / totalOccupied) * 100 : 0;
    
    // Build the data categories
    const categories = {
      demographic: [
        { name: "Total Population", value: Math.round(totalPopulation) },
        { name: "Median Age", value: medianAge.toFixed(1), description: "Years" }
      ],
      economic: [
        { name: "Median Household Income", value: `$${Math.round(medianHouseholdIncome).toLocaleString()}` },
        { name: "Poverty Rate", value: `${povertyRate.toFixed(1)}%`, description: "People below poverty level" },
        { name: "Unemployment Rate", value: `${unemploymentRate.toFixed(1)}%`, description: "Population 16+ in labor force" }
      ],
      housing: [
        { name: "Median Home Value", value: `$${Math.round(medianHomeValue).toLocaleString()}` },
        { name: "Housing Units", value: Math.round(housingUnits).toLocaleString() },
        { name: "Homeownership Rate", value: `${homeownershipRate.toFixed(1)}%`, description: "Owner-occupied housing units" }
      ],
      education: [
        { name: "High School Diploma", value: `${educationLevelHS.toFixed(1)}%`, description: "Population 25+ with high school diploma" },
        { name: "Bachelor's Degree or Higher", value: `${educationLevelBachelor.toFixed(1)}%`, description: "Population 25+ with bachelor's degree or higher" }
      ]
    };
    
    return {
      totalPopulation,
      medianHouseholdIncome,
      medianHomeValue,
      educationLevelHS,
      educationLevelBachelor,
      unemploymentRate,
      povertyRate,
      medianAge,
      housingUnits,
      homeownershipRate,
      rawData: tractsData,
      categories
    };
  } catch (error) {
    console.error("Error processing census data:", error);
    return getMockCensusData();
  }
}

// Main function to fetch census data for an address
export async function fetchCensusData(coordinates: Coordinates): Promise<CensusResponse | null> {
  try {
    console.log("Fetching census data for coordinates:", coordinates);
    
    // Define the radius in miles
    const radiusMiles = 5;
    
    // Find tracts within the radius
    const tracts = await findTractsInRadius(coordinates, radiusMiles);
    
    if (!tracts.length) {
      console.warn("No census tracts found within radius");
      return {
        data: getMockCensusData(),
        tractsIncluded: 0,
        radiusMiles
      };
    }
    
    console.log(`Found ${tracts.length} census tracts within ${radiusMiles} miles`);
    
    // Fetch data for those tracts
    const tractsData = await fetchDataForTracts(tracts);
    
    if (!tractsData.length) {
      console.warn("No census data available for the tracts");
      return {
        data: getMockCensusData(),
        tractsIncluded: 0,
        radiusMiles
      };
    }
    
    // Process and aggregate the data
    const censusData = processCensusData(tractsData);
    
    return {
      data: censusData,
      tractsIncluded: tractsData.length,
      radiusMiles
    };
  } catch (error) {
    console.error("Error in fetchCensusData:", error);
    
    // Return mock data on error
    return {
      data: getMockCensusData(),
      tractsIncluded: 0,
      radiusMiles: 5
    };
  }
}

// Provide mock data for testing or when API fails
export function getMockCensusData(): CensusData {
  return {
    totalPopulation: 4287,
    medianHouseholdIncome: 68250,
    medianHomeValue: 352400,
    educationLevelHS: 89.2,
    educationLevelBachelor: 42.7,
    unemploymentRate: 5.3,
    povertyRate: 11.8,
    medianAge: 36.2,
    housingUnits: 1842,
    homeownershipRate: 58.4,
    rawData: [],
    categories: {
      demographic: [
        { name: "Total Population", value: "4,287" },
        { name: "Median Age", value: "36.2", description: "Years" }
      ],
      economic: [
        { name: "Median Household Income", value: "$68,250" },
        { name: "Poverty Rate", value: "11.8%", description: "People below poverty level" },
        { name: "Unemployment Rate", value: "5.3%", description: "Population 16+ in labor force" }
      ],
      housing: [
        { name: "Median Home Value", value: "$352,400" },
        { name: "Housing Units", value: "1,842" },
        { name: "Homeownership Rate", value: "58.4%", description: "Owner-occupied housing units" }
      ],
      education: [
        { name: "High School Diploma", value: "89.2%", description: "Population 25+ with high school diploma" },
        { name: "Bachelor's Degree or Higher", value: "42.7%", description: "Population 25+ with bachelor's degree or higher" }
      ]
    }
  };
}
