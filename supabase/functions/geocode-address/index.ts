
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request format",
          details: parseError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { address } = requestData;

    if (!address) {
      console.error("No address provided in request");
      return new Response(
        JSON.stringify({ error: "Address is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Geocoding address: ${address}`);
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    
    if (!GOOGLE_API_KEY) {
      console.error("Google Maps API key not found in environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing API key" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_API_KEY}`;
    
    console.log(`Making geocoding request to Google Maps API`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        // Add timeout to the fetch request
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Maps API error: ${response.status} - ${errorText}`);
        throw new Error(`Google Maps API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Google Maps API response status: ${data.status}`);
      
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
        return new Response(
          JSON.stringify({
            error: `Geocoding failed: ${data.status}`,
            details: data.error_message || "Could not geocode the provided address"
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } catch (fetchError) {
      console.error("Error fetching from Google Maps API:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Error contacting Google Maps API",
          details: fetchError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error("Error in geocode-address function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred during geocoding",
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
