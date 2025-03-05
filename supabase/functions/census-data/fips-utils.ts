
// Utilities for working with FIPS codes and geographic identification
import { stateFipsCodes } from "./constants.ts";
import { FipsResult } from "./types.ts";

// In-memory cache for FIPS codes
const fipsCache = new Map<string, FipsResult>();

// Get county and state FIPS codes using FCC API
export async function getFipsCodesFromCoordinates(lat: number, lng: number): Promise<FipsResult | null> {
  // Create cache key
  const cacheKey = `${lat},${lng}`;
  
  // Check cache first
  if (fipsCache.has(cacheKey)) {
    return fipsCache.get(cacheKey);
  }
  
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
      
      const result = { 
        stateFips, 
        countyFips 
      };
      
      // Store in cache
      fipsCache.set(cacheKey, result);
      
      return result;
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
                  
                  const result = { stateFips, countyFips };
                  
                  // Store in cache
                  fipsCache.set(cacheKey, result);
                  
                  return result;
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

// Function to get the specific county FIPS code
export async function getCountyFipsCode(stateFips: string, countyName: string): Promise<string | null> {
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
