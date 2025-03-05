
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../census-data/constants.ts";

interface GeocodingResult {
  formattedAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  stateCode?: string;
  countyName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    const { address } = requestData;

    if (!address) {
      throw new Error("Address is required");
    }

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
      
      const geocodingResult: GeocodingResult = { 
        formattedAddress,
        coordinates: {
          lat, 
          lng
        },
        stateCode,
        countyName
      };
      
      return new Response(
        JSON.stringify(geocodingResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error(`Geocoding failed: ${data.status}`, data);
      throw new Error(`Geocoding failed: ${data.status}`);
    }
  } catch (error) {
    console.error("Error in geocode-address function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred during geocoding"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
