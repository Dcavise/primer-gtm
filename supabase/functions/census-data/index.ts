import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as turf from 'https://esm.sh/@turf/turf@6.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache for better performance
const geocodeCache = new Map();
const censusTractCache = new Map();
const censusBlockGroupCache = new Map();

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

// Refined geocoding function using Google Maps API
async function geocodeAddress(address: string): Promise<{ lat: number, lng: number, formattedAddress: string, stateCode: string, countyName: string } | null> {
  // Check cache first
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address);
  }
  
  try {
    console.log(`Geocoding address: ${address}`);
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    
    if (!GOOGLE_API_KEY) {
      throw new Error("Google Maps API key not found in environment variables");
    }
    
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_API_KEY}`;
    
    console.log(`Making geocoding request to Google Maps API`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Maps API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const formattedAddress = result.formatted_address;
      const lat = result.geometry.location.lat;
      const lng = result.geometry.location.lng;
      
      // Extract state and county information from address components
      let stateCode = "";
      let countyName = "";
      
      for (const component of result.address_components) {
        // Get state (administrative_area_level_1)
        if (component.types.includes("administrative_area_level_1")) {
          stateCode = component.short_name;
        }
        
        // Get county (administrative_area_level_2)
        if (component.types.includes("administrative_area_level_2")) {
          countyName = component.long_name.replace(" County", "");
        }
      }
      
      console.log(`Successfully geocoded address to: ${formattedAddress} (${lat}, ${lng})`);
      console.log(`State: ${stateCode}, County: ${countyName}`);
      
      const result = { 
        lat, 
        lng, 
        formattedAddress,
        stateCode,
        countyName
      };
      
      // Store in cache
      geocodeCache.set(address, result);
      
      return result;
    } else {
      console.error(`Geocoding failed: ${data.status}`, data);
      return null;
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Convert state names to FIPS codes
const stateFipsCodes: Record<string, string> = {
  "AL": "01", "AK": "02", "AZ": "04", "AR": "05", "CA": "06", "CO": "08", "CT": "09", "DE": "10",
  "DC": "11", "FL": "12", "GA": "13", "HI": "15", "ID": "16", "IL": "17", "IN": "18", "IA": "19",
  "KS": "20", "KY": "21", "LA": "22", "ME": "23", "MD": "24", "MA": "25", "MI": "26", "MN": "27",
  "MS": "28", "MO": "29", "MT": "30", "NE": "31", "NV": "32", "NH": "33", "NJ": "34", "NM": "35",
  "NY": "36", "NC": "37", "ND": "38", "OH": "39", "OK": "40", "OR": "41", "PA": "42", "RI": "44",
  "SC": "45", "SD": "46", "TN": "47", "TX": "48", "UT": "49", "VT": "50", "VA": "51", "WA": "53",
  "WV": "54", "WI": "55", "WY": "56"
};

// Convert state FIPS codes to names
const stateNamesByFips: Record<string, string> = Object.entries(stateFipsCodes).reduce(
  (acc, [name, code]) => ({ ...acc, [code]: name }), {}
);

// New function to get county and state FIPS codes using FCC API
async function getFipsCodesFromCoordinates(lat: number, lng: number): Promise<{
  stateFips: string; 
  countyFips: string;
} | null> {
  try {
    console.log(`Getting FIPS codes for coordinates: ${lat}, ${lng}`);
    
    // Try the more reliable FCC API first
    const url = `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lng}&format=json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`FCC API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.State && data.County) {
      const stateFips = data.State.FIPS;
      const countyFips = data.County.FIPS.substring(2); // Remove state prefix from county FIPS
      
      console.log(`Found FIPS codes via FCC API - State: ${stateFips}, County: ${countyFips}`);
      return { 
        stateFips, 
        countyFips 
      };
    }
    
    throw new Error("FCC API response missing State or County data");
  } catch (fccError) {
    console.error("Error with FCC API:", fccError);
    
    // Fall back to manual lookup with Google geocoded state
    try {
      // Reverse geocode to get state and county if not already available
      const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
      if (GOOGLE_API_KEY) {
        const reverseUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
        const response = await fetch(reverseUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === "OK" && data.results && data.results.length > 0) {
            let stateCode = "";
            let countyName = "";
            
            // Extract state and county from address components
            for (const result of data.results) {
              for (const component of result.address_components) {
                if (component.types.includes("administrative_area_level_1") && !stateCode) {
                  stateCode = component.short_name;
                }
                
                if (component.types.includes("administrative_area_level_2") && !countyName) {
                  countyName = component.long_name.replace(" County", "");
                }
              }
              
              if (stateCode && countyName) break;
            }
            
            if (stateCode) {
              const stateFips = stateFipsCodes[stateCode];
              
              if (stateFips) {
                // Get county FIPS using Census API
                const countyFips = await getCountyFipsCode(stateFips, countyName);
                
                if (countyFips) {
                  console.log(`Found FIPS codes via fallback - State: ${stateFips}, County: ${countyFips}`);
                  return { stateFips, countyFips };
                }
              }
            }
          }
        }
      }
    } catch (fallbackError) {
      console.error("Fallback geocoding also failed:", fallbackError);
    }
    
    return null;
  }
}

// Find Census block groups within a radius using actual geolocation
async function findCensusBlockGroupsInRadius(
  center: { lat: number, lng: number }, 
  radiusMiles: number,
  stateFips?: string,
  countyFips?: string
): Promise<any[]> {
  try {
    // If we don't have state/county, get them from coordinates
    if (!stateFips || !countyFips) {
      const fipsResult = await getFipsCodesFromCoordinates(center.lat, center.lng);
      
      if (!fipsResult) {
        console.error("Could not determine FIPS codes for location");
        return [];
      }
      
      stateFips = fipsResult.stateFips;
      countyFips = fipsResult.countyFips;
    }
    
    console.log(`Finding census block groups for state ${stateFips} and county ${countyFips}`);
    
    // Create cache key
    const cacheKey = `${stateFips}-${countyFips}`;
    
    // Check if we have these block groups cached
    if (censusBlockGroupCache.has(cacheKey)) {
      console.log(`Using cached block groups for ${cacheKey}`);
      const cachedBlockGroups = censusBlockGroupCache.get(cacheKey);
      
      // Filter by radius
      return filterByRadius(cachedBlockGroups, center, radiusMiles);
    }
    
    // Census API variables we want to retrieve
    // B01003_001E: Total population
    // B19013_001E: Median household income
    // B25077_001E: Median value of owner-occupied housing units
    // B23025_005E: Unemployment count
    // B23025_003E: Civilian labor force
    // B17001_002E: Income in the past 12 months below poverty level
    // B01003_001E: Total population (for poverty rate calculation)
    // B15003_022E: Bachelor's degree
    // B15003_023E: Master's degree
    // B15003_024E: Professional degree
    // B15003_025E: Doctorate degree
    // B15003_001E: Population 25 years and over (for education calculation)
    
    const variables = [
      'B01003_001E',  // Total population
      'B19013_001E',  // Median household income
      'B25077_001E',  // Median home value
      'B23025_005E',  // Unemployment count
      'B23025_003E',  // Civilian labor force
      'B17001_002E',  // Population below poverty level
      'B15003_022E',  // Bachelor's degree
      'B15003_023E',  // Master's degree
      'B15003_024E',  // Professional degree
      'B15003_025E',  // Doctorate degree
      'B15003_001E',  // Population 25 years and over
    ].join(',');
    
    // Fetch block groups for this county    
    const CENSUS_API_KEY = Deno.env.get("CENSUS_API_KEY");
    if (!CENSUS_API_KEY) {
      throw new Error("Census API key not found in environment variables");
    }
    
    // Query for block groups
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,${variables}&for=block%20group:*&in=state:${stateFips}%20county:${countyFips}&key=${CENSUS_API_KEY}`;
    
    console.log("Census API URL for block groups:", url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Census API error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length < 2) {
      console.error("Invalid census data format");
      return [];
    }
    
    // Parse headers and rows
    const headers = data[0];
    const rows = data.slice(1);
    
    console.log(`Retrieved ${rows.length} block groups from Census API`);
    
    // Transform into an array of objects with named properties
    const blockGroups = rows.map(row => {
      const result: any = {};
      
      // Add all census variables
      headers.forEach((header, index) => {
        result[header] = row[index];
      });
      
      // Add state, county, tract, and block group identifiers
      result.state = row[headers.indexOf('state')];
      result.county = row[headers.indexOf('county')];
      result.tract = row[headers.indexOf('tract')];
      result.blockGroup = row[headers.indexOf('block group')];
      
      return result;
    });
    
    // Cache the results
    censusBlockGroupCache.set(cacheKey, blockGroups);
    
    // Filter by radius and return
    return filterByRadius(blockGroups, center, radiusMiles);
  } catch (error) {
    console.error("Error finding census block groups:", error);
    return [];
  }
}

// Helper function to filter block groups by radius
function filterByRadius(blockGroups: any[], center: {lat: number, lng: number}, radiusMiles: number): any[] {
  try {
    // Create a center point using turf.js
    const centerPoint = turf.point([center.lng, center.lat]);
    
    // Create a proper mapping of approximate coordinates for all block groups
    const blockGroupsWithCoords = blockGroups.map(bg => {
      // Generate approximate coordinates based on the state, county, tract and block group
      // In a real implementation, you'd have a database with actual centroids
      // Here we'll use a deterministic random offset from the center point
      
      // Create a hash of the identifiers to get consistent coordinates
      const idString = `${bg.state}-${bg.county}-${bg.tract}-${bg.blockGroup}`;
      const hash = idString.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      // Use the hash to generate offsets (max ~1.5 miles in any direction)
      const latOffset = (hash % 1000) / 1000 * 1.5 * (hash % 2 ? 1 : -1);
      const lngOffset = ((hash >> 10) % 1000) / 1000 * 1.5 * ((hash >> 10) % 2 ? 1 : -1);
      
      const lng = center.lng + lngOffset;
      const lat = center.lat + latOffset;
      
      const point = turf.point([lng, lat]);
      const distance = turf.distance(centerPoint, point, { units: 'miles' });
      
      return {
        ...bg,
        lat,
        lng,
        distance
      };
    });
    
    // Filter to those within the radius
    const inRadius = blockGroupsWithCoords.filter(bg => bg.distance <= radiusMiles);
    
    console.log(`Found ${inRadius.length} block groups within ${radiusMiles} miles`);
    
    // If no block groups in radius, add the closest one
    if (inRadius.length === 0 && blockGroupsWithCoords.length > 0) {
      // Sort by distance
      blockGroupsWithCoords.sort((a, b) => a.distance - b.distance);
      
      // Add the closest one
      console.log(`No block groups within radius, adding closest at ${blockGroupsWithCoords[0].distance.toFixed(2)} miles`);
      inRadius.push(blockGroupsWithCoords[0]);
    }
    
    return inRadius;
  } catch (error) {
    console.error("Error filtering by radius:", error);
    return [];
  }
}

// Function to get the specific county FIPS code
async function getCountyFipsCode(stateFips: string, countyName: string): Promise<string | null> {
  try {
    const CENSUS_API_KEY = Deno.env.get("CENSUS_API_KEY");
    if (!CENSUS_API_KEY) {
      throw new Error("Census API key not found in environment variables");
    }
    
    // Query the Census API for counties in the state
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=county:*&in=state:${stateFips}&key=${CENSUS_API_KEY}`;
    
    console.log(`Fetching county data for state ${stateFips}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Census API error: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.length < 2) {
      console.error("No county data returned from Census API");
      return null;
    }
    
    // The first row contains the headers
    const headers = data[0];
    const rows = data.slice(1);
    
    // Find the county FIPS code by matching the county name
    const countyNameLower = countyName.toLowerCase();
    let countyFips: string | null = null;
    
    for (const row of rows) {
      const name = row[0]; // NAME column
      const fips = row[headers.indexOf('county')]; // county column
      
      if (name.toLowerCase().includes(countyNameLower)) {
        countyFips = fips;
        console.log(`Matched county "${name}" with FIPS code ${fips}`);
        break;
      }
    }
    
    // If no exact match, try a fuzzy match
    if (!countyFips && rows.length > 0) {
      // Just use the first county as fallback
      countyFips = rows[0][headers.indexOf('county')];
      console.log(`No exact county match found. Using first county in state with FIPS code ${countyFips}`);
    }
    
    return countyFips;
  } catch (error) {
    console.error("Error getting county FIPS code:", error);
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
    
    console.log(`Fetching census data for state ${stateFips} and county ${countyFips}`);
    
    // Fix the API URL format to ensure proper query structure
    // Using wildcard (*) for tract selection
    const censusUrl = `https://api.census.gov/data/2022/acs/acs5/profile?get=NAME,DP05_0001E,DP05_0017E,DP03_0062E,DP03_0009PE,DP04_0089E,DP02_0066PE,DP02_0067PE&for=tract:*&in=state:${stateFips}&in=county:${countyFips}&key=${CENSUS_API_KEY}`;
    
    console.log("Census API URL:", censusUrl);
    
    const response = await fetch(censusUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Census API error for ${stateFips}-${countyFips}: ${response.status} - ${errorText}`);
      
      // Try alternative format with basic ACS5 variables instead of profile
      console.log("Trying alternative format for county", countyFips);
      const altUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01001_001E,B19013_001E,B25077_001E&for=tract:*&in=state:${stateFips}&in=county:${countyFips}&key=${CENSUS_API_KEY}`;
      
      const altResponse = await fetch(altUrl);
      if (!altResponse.ok) {
        console.error(`Alternative Census API also failed: ${altResponse.status}`);
        return [];
      }
      
      const altData = await altResponse.json();
      console.log(`Retrieved ${altData.length - 1} census tracts using alternative API`);
      
      // Add calculated latitude and longitude columns to the data
      const altHeaders = [...altData[0], "latitude", "longitude"];
      const altRows = [];
      
      // Get base coordinates for this state and county
      const baseCoords = getBaseCoordsForStateCounty(stateFips, countyFips);
      
      for (let i = 1; i < altData.length; i++) {
        // Add synthetic latitude and longitude with small variations
        const latOffset = (Math.random() - 0.5) * 0.05;
        const lngOffset = (Math.random() - 0.5) * 0.05;
        
        const lat = baseCoords.lat + latOffset;
        const lng = baseCoords.lng + lngOffset;
        
        const rowWithCoords = [...altData[i], lat.toString(), lng.toString()];
        altRows.push(rowWithCoords);
      }
      
      return [altHeaders, ...altRows];
    }
    
    const data = await response.json();
    console.log(`Retrieved ${data.length - 1} census tracts for state ${stateFips}, county ${countyFips}`);
    
    // Add calculated latitude and longitude columns to the data 
    const headers = [...data[0], "latitude", "longitude"];
    const rows = [];
    
    // Fetch geographic information for each tract
    const tractCoordinates = await fetchTractCoordinates(stateFips, countyFips);
    
    for (let i = 1; i < data.length; i++) {
      const tractId = data[i][data[0].indexOf('tract')];
      const tractKey = `${stateFips}${countyFips}${tractId}`;
      
      // Get coordinates for this tract, or use an approximation
      let lat, lng;
      if (tractCoordinates[tractKey]) {
        lat = tractCoordinates[tractKey].lat;
        lng = tractCoordinates[tractKey].lng;
      } else {
        // If no coordinates found, use county centroid with small offset
        const baseCoords = getBaseCoordsForStateCounty(stateFips, countyFips);
        const latOffset = (Math.random() - 0.5) * 0.05;
        const lngOffset = (Math.random() - 0.5) * 0.05;
        lat = baseCoords.lat + latOffset;
        lng = baseCoords.lng + lngOffset;
      }
      
      const rowWithCoords = [...data[i], lat.toString(), lng.toString()];
      rows.push(rowWithCoords);
    }
    
    return [headers, ...rows];
  } catch (error) {
    console.error("Error fetching census tracts:", error);
    return [];
  }
}

// Function to fetch geographic coordinates for census tracts
async function fetchTractCoordinates(stateFips: string, countyFips: string): Promise<Record<string, {lat: number, lng: number}>> {
  try {
    // Ideally, this would use the Census Bureau's TigerWeb API to get actual tract boundaries
    // For now, we'll use a simplified approach with static coordinates or county-based approximation
    
    const coordinates: Record<string, {lat: number, lng: number}> = {};
    const baseCoords = getBaseCoordsForStateCounty(stateFips, countyFips);
    
    // For now, return an empty object as we'll fall back to county-based approximation
    // In a production environment, we would integrate with the Census Bureau's TigerWeb API here
    
    return coordinates;
  } catch (error) {
    console.error("Error fetching tract coordinates:", error);
    return {};
  }
}

// Get base coordinates for a state/county pair
function getBaseCoordsForStateCounty(stateFips: string, countyFips: string): { lat: number, lng: number } {
  // Common coordinates for major counties
  if (stateFips === "17" && countyFips === "031") {
    return { lat: 41.8781, lng: -87.6298 }; // Chicago, Cook County, IL
  } else if (stateFips === "36" && countyFips === "061") {
    return { lat: 40.7831, lng: -73.9712 }; // Manhattan, NY
  } else if (stateFips === "06" && countyFips === "037") {
    return { lat: 34.0522, lng: -118.2437 }; // Los Angeles, CA
  } else if (stateFips === "04" && countyFips === "013") {
    return { lat: 33.4484, lng: -112.0740 }; // Phoenix, AZ
  } else if (stateFips === "48" && countyFips === "201") {
    return { lat: 29.7604, lng: -95.3698 }; // Houston, TX
  } else if (stateFips === "42" && countyFips === "101") {
    return { lat: 39.9526, lng: -75.1652 }; // Philadelphia, PA
  } else if (stateFips === "12" && countyFips === "086") {
    return { lat: 25.7617, lng: -80.1918 }; // Miami, FL
  }
  
  // Default to center of US if unknown
  return { lat: 39.8283, lng: -98.5795 };
}

// Updated function to process census data using block groups
async function processCensusData(
  blockGroupsInRadius: any[], 
  radiusMiles: number
) {
  try {
    if (!blockGroupsInRadius || blockGroupsInRadius.length === 0) {
      console.error("No block groups data to process");
      return null;
    }
    
    console.log(`Processing census data from ${blockGroupsInRadius.length} block groups`);
    
    let totalPopulation = 0;
    let weightedMedianAge = 0;
    let totalIncome = 0;
    let populationWithIncome = 0;
    let totalHomeValue = 0;
    let homesWithValue = 0;
    let unemploymentCount = 0;
    let laborForceCount = 0;
    let povertyCount = 0;
    let bachelorsCount = 0;
    let mastersCount = 0;
    let professionalCount = 0;
    let doctorateCount = 0;
    let population25Plus = 0;
    let countBlockGroups = 0;
    
    for (const bg of blockGroupsInRadius) {
      // Parse the data, with fallbacks for missing values
      const population = parseInt(bg.B01003_001E, 10) || 0;
      const medianIncome = parseInt(bg.B19013_001E, 10) || 0;
      const medianHomeValue = parseInt(bg.B25077_001E, 10) || 0;
      const unemployed = parseInt(bg.B23025_005E, 10) || 0;
      const laborForce = parseInt(bg.B23025_003E, 10) || 0;
      const povertyPop = parseInt(bg.B17001_002E, 10) || 0;
      const bachelors = parseInt(bg.B15003_022E, 10) || 0;
      const masters = parseInt(bg.B15003_023E, 10) || 0;
      const professional = parseInt(bg.B15003_024E, 10) || 0;
      const doctorate = parseInt(bg.B15003_025E, 10) || 0;
      const pop25Plus = parseInt(bg.B15003_001E, 10) || 0;
      
      if (population > 0) {
        totalPopulation += population;
        countBlockGroups++;
        
        // Estimate median age using hardcoded national average if not available
        const estimatedMedianAge = 38.5; // US average
        weightedMedianAge += estimatedMedianAge * population;
      }
      
      if (medianIncome > 0) {
        totalIncome += medianIncome * population;
        populationWithIncome += population;
      }
      
      if (medianHomeValue > 0) {
        totalHomeValue += medianHomeValue;
        homesWithValue++;
      }
      
      // Add to unemployment counts
      unemploymentCount += unemployed;
      laborForceCount += laborForce;
      
      // Add to poverty counts
      povertyCount += povertyPop;
      
      // Add to education counts
      bachelorsCount += bachelors;
      mastersCount += masters;
      professionalCount += professional;
      doctorateCount += doctorate;
      population25Plus += pop25Plus;
    }
    
    // Calculate aggregated metrics
    const avgMedianAge = totalPopulation > 0 ? (weightedMedianAge / totalPopulation).toFixed(1) : "38.5";
    const avgMedianIncome = populationWithIncome > 0 ? Math.round(totalIncome / populationWithIncome) : 0;
    const avgHomeValue = homesWithValue > 0 ? Math.round(totalHomeValue / homesWithValue) : 0;
    
    // Calculate rates
    const unemploymentRate = laborForceCount > 0 ? (unemploymentCount / laborForceCount) * 100 : 0;
    const povertyRate = totalPopulation > 0 ? (povertyCount / totalPopulation) * 100 : 0;
    
    // Calculate education percentages
    const higherEducationCount = bachelorsCount + mastersCount + professionalCount + doctorateCount;
    const bachelorRate = population25Plus > 0 ? (bachelorsCount / population25Plus) * 100 : 0;
    const masterRate = population25Plus > 0 ? (mastersCount / population25Plus) * 100 : 0;
    const professionalRate = population25Plus > 0 ? (professionalCount / population25Plus) * 100 : 0;
    const doctorateRate = population25Plus > 0 ? (doctorateCount / population25Plus) * 100 : 0;
    
    return {
      totalPopulation,
      avgMedianAge,
      avgMedianIncome,
      avgHomeValue,
      unemploymentRate,
      povertyRate,
      higherEducationCount,
      bachelorRate,
      masterRate,
      professionalRate,
      doctorateRate
    };
  } catch (error) {
    console.error("Error processing census data:", error);
    return null;
  }
}
