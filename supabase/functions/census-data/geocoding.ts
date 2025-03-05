
// Geocoding functions to convert addresses to coordinates
import { GeocodingResult } from "./types.ts";

// In-memory cache for geocoding results
const geocodeCache = new Map<string, GeocodingResult>();

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
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
      
      const result2 = { 
        lat, 
        lng, 
        formattedAddress,
        stateCode,
        countyName
      };
      
      // Store in cache
      geocodeCache.set(address, result2);
      
      return result2;
    } else {
      console.error(`Geocoding failed: ${data.status}`, data);
      return null;
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
