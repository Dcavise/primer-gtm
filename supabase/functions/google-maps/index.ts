
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  console.log("Processing google-maps request");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    const { operation, address } = requestData;
    
    // Validate required parameters
    if (!operation) {
      console.error("No operation specified");
      return new Response(
        JSON.stringify({ 
          error: 'Operation is required',
          validOperations: ['geocode']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing ${operation} operation`);
    
    // Handle different operations
    if (operation === 'geocode') {
      return await handleGeocode(address);
    } else {
      console.error(`Invalid operation: ${operation}`);
      return new Response(
        JSON.stringify({ 
          error: `Invalid operation: ${operation}`,
          validOperations: ['geocode']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error in google-maps function:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handles geocoding an address to get coordinates
 */
async function handleGeocode(address: string) {
  if (!address) {
    console.error("No address provided for geocoding");
    return new Response(
      JSON.stringify({ error: 'Address is required for geocoding' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`Geocoding address: ${address}`);
  
  // Get the Google Maps API key from environment variables
  const apiKey = Deno.env.get("GOOGLE_API_KEY") || 
                Deno.env.get("GOOGLE_MAPS_API_KEY") || 
                Deno.env.get("MAPS_PLATFORM_API_KEY");
  
  if (!apiKey) {
    console.error("No Google Maps API key found in environment variables");
    return new Response(
      JSON.stringify({ 
        error: 'Google Maps API key not configured',
        details: 'Please configure one of GOOGLE_API_KEY, GOOGLE_MAPS_API_KEY, or MAPS_PLATFORM_API_KEY in Supabase secrets'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Call the Google Maps Geocoding API
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    console.log("Making request to Google Maps Geocoding API");
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Google Geocoding API error: ${response.status} - ${response.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Google Geocoding API error',
          details: `HTTP ${response.status}: ${response.statusText}`
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const data = await response.json();
    console.log(`Google Geocoding API response status: ${data.status}`);
    
    if (data.status !== 'OK') {
      console.error(`Geocoding error: ${data.status}`, data.error_message || 'No additional details');
      return new Response(
        JSON.stringify({ 
          error: `Geocoding failed with status: ${data.status}`,
          details: data.error_message || 'Address could not be geocoded'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!data.results || data.results.length === 0) {
      console.error("No results found for the address");
      return new Response(
        JSON.stringify({ 
          error: 'No results found for the address',
          status: data.status
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract the formatted address and coordinates from the first result
    const result = data.results[0];
    const formattedAddress = result.formatted_address;
    const location = result.geometry.location;
    
    // Extract place details like city, state, country, etc.
    const addressComponents = {};
    
    for (const component of result.address_components) {
      for (const type of component.types) {
        addressComponents[type] = {
          long_name: component.long_name,
          short_name: component.short_name
        };
      }
    }
    
    console.log(`Successfully geocoded address to: ${formattedAddress} (${location.lat}, ${location.lng})`);
    
    // Return the geocoded data with cache control
    return new Response(
      JSON.stringify({
        formattedAddress,
        coordinates: {
          lat: location.lat,
          lng: location.lng
        },
        addressComponents,
        placeId: result.place_id,
        types: result.types
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=2592000' // Cache for 30 days
        } 
      }
    );
  } catch (error) {
    console.error("Error during geocoding:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Geocoding operation failed',
        details: error.message || String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
