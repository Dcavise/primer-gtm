
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as turf from 'https://esm.sh/@turf/turf@6.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock data for testing purposes
const getMockCensusData = () => ({
  totalPopulation: 10000,
  medianHouseholdIncome: 60000,
  medianHomeValue: 250000,
  educationLevelHS: 90,
  educationLevelBachelor: 30,
  unemploymentRate: 5,
  povertyRate: 12,
  medianAge: 35,
  housingUnits: 4500,
  homeownershipRate: 60,
  categories: {
    demographic: [
      { name: "Population", value: "10,000" },
      { name: "Median Age", value: "35" },
      { name: "Population Density", value: "4,200/sq mi" },
      { name: "Population Growth", value: "1.5% annually" },
    ],
    economic: [
      { name: "Median Household Income", value: "$60,000" },
      { name: "Unemployment Rate", value: "5%" },
      { name: "Poverty Rate", value: "12%" },
      { name: "Employment in Services", value: "65%" },
    ],
    housing: [
      { name: "Median Home Value", value: "$250,000" },
      { name: "Homeownership Rate", value: "60%" },
      { name: "Housing Units", value: "4,500" },
      { name: "Rental Vacancy Rate", value: "6%" },
    ],
    education: [
      { name: "Bachelor's Degree or Higher", value: "30%" },
      { name: "High School Graduate or Higher", value: "90%" },
      { name: "School Enrollment", value: "1,800" },
      { name: "Student-Teacher Ratio", value: "16:1" },
    ],
  },
  rawData: {},
});

// Convert FIPS codes to county/state names
const stateNamesByFips: Record<string, string> = {
  "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas", 
  "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware", 
  "11": "District of Columbia", "12": "Florida", "13": "Georgia", "15": "Hawaii", 
  "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa", 
  "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine", 
  "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota", 
  "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska", 
  "32": "Nevada", "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico", 
  "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio", 
  "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island", 
  "45": "South Carolina", "46": "South Dakota", "47": "Tennessee", "48": "Texas", 
  "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington", 
  "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming"
};

// Find the Census tracts within a certain radius
async function findCensusTractsInRadius(
  center: { lat: number, lng: number }, 
  radiusMiles: number
): Promise<any[]> {
  try {
    // Determine which state/county the center point is in
    const containingArea = await findContainingTract(center);
    
    if (!containingArea) {
      console.error("Unable to identify census tract from coordinates");
      return [];
    }
    
    const { stateFips, countyFips } = containingArea;
    console.log(`Identified state ${stateFips} (${stateNamesByFips[stateFips] || 'Unknown'}) and county ${countyFips}`);
    
    // Get all tracts in this county as a starting point
    const censusData = await fetchTractsForStateCounty(stateFips, countyFips);
    
    if (!censusData || censusData.length < 2) {
      console.error("No census data returned for the identified area");
      return [];
    }
    
    const headers = censusData[0];
    const rows = censusData.slice(1);
    
    // Create a radius circle
    const centerPoint = turf.point([center.lng, center.lat]);
    const circle = turf.circle(centerPoint.geometry.coordinates, radiusMiles, { units: 'miles' });
    
    // Find lat/lon indices
    const latIndex = headers.indexOf('INTPTLAT');
    const lonIndex = headers.indexOf('INTPTLON');
    
    if (latIndex === -1 || lonIndex === -1) {
      console.error("Latitude/longitude not found in census data response");
      return [];
    }
    
    // Filter tracts within the radius
    const tractsInRadius = [];
    
    for (const row of rows) {
      const tractLat = parseFloat(row[latIndex]);
      const tractLon = parseFloat(row[lonIndex]);
      
      if (isNaN(tractLat) || isNaN(tractLon)) continue;
      
      const tractPoint = turf.point([tractLon, tractLat]);
      const distance = turf.distance(centerPoint, tractPoint, { units: 'miles' });
      
      if (distance <= radiusMiles) {
        tractsInRadius.push({
          state: stateFips,
          county: countyFips,
          tract: row[headers.indexOf('tract')],
          distance
        });
      }
    }
    
    console.log(`Found ${tractsInRadius.length} census tracts within ${radiusMiles} miles`);
    
    // Add at least one tract if none were found
    if (tractsInRadius.length === 0 && rows.length > 0) {
      console.log("No tracts within radius, adding closest tract");
      const closest = { index: 0, distance: Infinity };
      
      for (let i = 0; i < rows.length; i++) {
        const tractLat = parseFloat(rows[i][latIndex]);
        const tractLon = parseFloat(rows[i][lonIndex]);
        
        if (isNaN(tractLat) || isNaN(tractLon)) continue;
        
        const tractPoint = turf.point([tractLon, tractLat]);
        const distance = turf.distance(centerPoint, tractPoint, { units: 'miles' });
        
        if (distance < closest.distance) {
          closest.index = i;
          closest.distance = distance;
        }
      }
      
      tractsInRadius.push({
        state: stateFips,
        county: countyFips,
        tract: rows[closest.index][headers.indexOf('tract')],
        distance: closest.distance
      });
      
      console.log(`Added closest tract at distance ${closest.distance.toFixed(2)} miles`);
    }
    
    return tractsInRadius;
  } catch (error) {
    console.error("Error finding census tracts:", error);
    return [];
  }
}

// Find the Census tract containing a specific point (lat/lng)
async function findContainingTract(center: { lat: number, lng: number }): Promise<{stateFips: string, countyFips: string, tract: string} | null> {
  try {
    // For Illinois (17) / Cook County (031) - Chicago area
    if (center.lat > 41.6 && center.lat < 42.1 && center.lng > -88 && center.lng < -87.5) {
      return { stateFips: "17", countyFips: "031", tract: "010100" };
    }
    
    // Try a few major metropolitan areas based on lat/lng bounds
    // New York City area (36/061 - Manhattan)
    if (center.lat > 40.6 && center.lat < 40.9 && center.lng > -74.1 && center.lng < -73.9) {
      return { stateFips: "36", countyFips: "061", tract: "010100" };
    }
    
    // Los Angeles area (06/037)
    if (center.lat > 33.7 && center.lat < 34.3 && center.lng > -118.5 && center.lng < -118.1) {
      return { stateFips: "06", countyFips: "037", tract: "010100" };
    }
    
    // Simple geographic lookup based on latitude/longitude bounds
    let stateFips = "";
    
    // Simple cases - this is an approximation
    if (center.lng < -114 && center.lat > 42) stateFips = "16"; // Idaho
    else if (center.lng < -114 && center.lat < 42) stateFips = "32"; // Nevada
    else if (center.lng < -109 && center.lat > 41) stateFips = "56"; // Wyoming
    else if (center.lng < -109 && center.lat < 41 && center.lat > 37) stateFips = "49"; // Utah
    else if (center.lng < -109 && center.lat < 37) stateFips = "04"; // Arizona
    else if (center.lng < -103 && center.lat > 41) stateFips = "08"; // Colorado
    else if (center.lng < -103 && center.lat < 41) stateFips = "35"; // New Mexico
    else if (center.lng < -94 && center.lat > 37) stateFips = "20"; // Kansas
    else if (center.lng < -94 && center.lat < 37) stateFips = "40"; // Oklahoma
    else if (center.lng < -90 && center.lat > 40) stateFips = "17"; // Illinois
    else if (center.lng < -90 && center.lat < 40 && center.lat > 34) stateFips = "29"; // Missouri
    else if (center.lng < -90 && center.lat < 34) stateFips = "05"; // Arkansas
    else if (center.lng < -84 && center.lat > 35) stateFips = "21"; // Kentucky
    else if (center.lng < -84 && center.lat < 35) stateFips = "13"; // Georgia
    else if (center.lng < -75 && center.lat > 39.5) stateFips = "42"; // Pennsylvania
    else if (center.lng < -75 && center.lat < 39.5) stateFips = "24"; // Maryland
    
    // If no state match, default to a commonly used example
    if (!stateFips) {
      console.log("Could not identify state from coordinates, using Illinois as default");
      stateFips = "17"; // Illinois
      return { stateFips, countyFips: "031", tract: "010100" }; // Cook County, Chicago
    }
    
    // For simplicity, we'll return a default county and tract for the identified state
    const defaultCountyFips = "001"; // Usually the first county in a state
    
    return { stateFips, countyFips: defaultCountyFips, tract: "010100" };
  } catch (error) {
    console.error("Error identifying containing tract:", error);
    return null;
  }
}

// Direct Census API query for tracts in a specific state and county
async function fetchTractsForStateCounty(stateFips: string, countyFips: string): Promise<any[]> {
  try {
    const CENSUS_API_KEY = Deno.env.get("CENSUS_API_KEY");
    if (!CENSUS_API_KEY) {
      throw new Error("Census API key not found in environment variables");
    }
    
    const censusUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01001_001E,B01002_001E,B19013_001E,B23025_005E,B25077_001E,B25010_001E,B15003_022E,B15003_025E,INTPTLAT,INTPTLON&for=tract:*&in=state:${stateFips}&in=county:${countyFips}&key=${CENSUS_API_KEY}`;
    
    const response = await fetch(censusUrl);
    if (!response.ok) {
      throw new Error(`Census API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching census tracts:", error);
    return [];
  }
}

async function processCensusData(
  tractsInRadius: any[], 
  allData: any[], 
  radiusMiles: number
) {
  // Process the data to create aggregate statistics
  // Variables:
  // B01001_001E: Total population
  // B01002_001E: Median age
  // B19013_001E: Median household income
  // B23025_005E: Unemployment
  // B25077_001E: Median home value
  // B25010_001E: Average household size
  // B15003_022E: Bachelor's degree
  // B15003_025E: High school diploma
  
  let totalPopulation = 0;
  let weightedMedianAge = 0;
  let totalIncome = 0;
  let populationWithIncome = 0;
  let totalHomeValue = 0;
  let homesWithValue = 0;
  let totalUnemployed = 0;
  let totalBachelors = 0;
  let totalHighSchool = 0;
  
  for (const row of allData) {
    const population = parseInt(row[1], 10) || 0;
    const medianAge = parseFloat(row[2]) || 0;
    const medianIncome = parseInt(row[3], 10) || 0;
    const unemployed = parseInt(row[4], 10) || 0;
    const medianHomeValue = parseInt(row[5], 10) || 0;
    const householdSize = parseFloat(row[6]) || 0;
    const bachelors = parseInt(row[7], 10) || 0;
    const highSchool = parseInt(row[8], 10) || 0;
    
    if (population > 0) {
      totalPopulation += population;
      weightedMedianAge += medianAge * population;
    }
    
    if (medianIncome > 0) {
      totalIncome += medianIncome * population;
      populationWithIncome += population;
    }
    
    if (medianHomeValue > 0) {
      totalHomeValue += medianHomeValue;
      homesWithValue++;
    }
    
    totalUnemployed += unemployed;
    totalBachelors += bachelors;
    totalHighSchool += highSchool;
  }
  
  // Calculate aggregated metrics
  const avgMedianAge = totalPopulation > 0 ? (weightedMedianAge / totalPopulation).toFixed(1) : "N/A";
  const avgMedianIncome = populationWithIncome > 0 ? Math.round(totalIncome / populationWithIncome) : 0;
  const avgHomeValue = homesWithValue > 0 ? Math.round(totalHomeValue / homesWithValue) : 0;
  const unemploymentRate = totalPopulation > 0 ? ((totalUnemployed / totalPopulation) * 100).toFixed(1) : "N/A";
  const bachelorRate = totalPopulation > 0 ? ((totalBachelors / totalPopulation) * 100).toFixed(1) : "N/A";
  const highSchoolRate = totalPopulation > 0 ? ((totalHighSchool / totalPopulation) * 100).toFixed(1) : "N/A";
  
  // Format the processed data according to our app's structure
  return {
    totalPopulation,
    medianHouseholdIncome: avgMedianIncome,
    medianHomeValue: avgHomeValue,
    educationLevelHS: parseFloat(highSchoolRate),
    educationLevelBachelor: parseFloat(bachelorRate),
    unemploymentRate: parseFloat(unemploymentRate),
    medianAge: parseFloat(avgMedianAge),
    categories: {
      demographic: [
        { name: "Population", value: totalPopulation.toLocaleString() },
        { name: "Median Age", value: avgMedianAge },
        { name: "Population Density", value: `${Math.round(totalPopulation / (Math.PI * radiusMiles * radiusMiles)).toLocaleString()}/sq mi` },
      ],
      economic: [
        { name: "Median Household Income", value: `$${avgMedianIncome.toLocaleString()}` },
        { name: "Unemployment Rate", value: `${unemploymentRate}%` },
      ],
      housing: [
        { name: "Median Home Value", value: `$${avgHomeValue.toLocaleString()}` },
        { name: "Average Household Size", value: "2.5" },
      ],
      education: [
        { name: "Bachelor's Degree or Higher", value: `${bachelorRate}%` },
        { name: "High School Graduate or Higher", value: `${highSchoolRate}%` },
      ],
    },
    rawData: { allData, tractsInRadius }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, address } = await req.json();
    
    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required coordinates (lat, lng)" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    console.log(`Fetching census data for coordinates: ${lat}, ${lng}`);
    
    const radiusMiles = 5;
    
    // Find all tracts within 5 miles
    const tractsInRadius = await findCensusTractsInRadius({ lat, lng }, radiusMiles);
    console.log(`Found ${tractsInRadius.length} census tracts within ${radiusMiles} miles`);
    
    if (tractsInRadius.length === 0) {
      console.log("No census tracts found in radius, using mock data");
      return new Response(
        JSON.stringify({
          data: getMockCensusData(),
          tractsIncluded: 0,
          radiusMiles,
          isMockData: true,
          searchedAddress: address || "Sample Location"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Fetch data for all tracts in radius
    const allData = [];
    
    // Group tracts by state and county for efficient querying
    const tractsByStateCounty: Record<string, any[]> = {};
    
    for (const tract of tractsInRadius) {
      const key = `${tract.state}-${tract.county}`;
      if (!tractsByStateCounty[key]) {
        tractsByStateCounty[key] = [];
      }
      tractsByStateCounty[key].push(tract);
    }
    
    // Fetch data for each state-county group
    for (const [key, tracts] of Object.entries(tractsByStateCounty)) {
      const [state, county] = key.split('-');
      const tractIds = tracts.map(t => t.tract).join(',');
      
      const CENSUS_API_KEY = Deno.env.get("CENSUS_API_KEY");
      if (!CENSUS_API_KEY) {
        throw new Error("Census API key not found in environment variables");
      }
      
      const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01001_001E,B01002_001E,B19013_001E,B23025_005E,B25077_001E,B25010_001E,B15003_022E,B15003_025E&for=tract:${tractIds}&in=state:${state}&in=county:${county}&key=${CENSUS_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Census API error for ${key}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      allData.push(...data.slice(1)); // Skip header row
    }
    
    if (allData.length === 0) {
      console.error("No data received from Census API");
      return new Response(
        JSON.stringify({
          data: getMockCensusData(),
          tractsIncluded: 0,
          radiusMiles,
          isMockData: true,
          searchedAddress: address || "Sample Location"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Process census data
    const processedData = await processCensusData(tractsInRadius, allData, radiusMiles);
    
    console.log("Census data processed successfully");
    
    return new Response(
      JSON.stringify({
        data: processedData,
        tractsIncluded: tractsInRadius.length,
        radiusMiles,
        isMockData: false,
        searchedAddress: address || "Unknown Location"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in census-data function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        data: getMockCensusData(),
        tractsIncluded: 0,
        radiusMiles: 5,
        isMockData: true,
        searchedAddress: "Error Location"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
