
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = {
  google_maps: Deno.env.get('GOOGLE_MAPS_API_KEY') || '',
  zoneomics: Deno.env.get('ZONEOMICS_API_KEY') || '',
  census: Deno.env.get('CENSUS_API_KEY') || '',
  greatschools: Deno.env.get('GREATSCHOOLS_API_KEY') || '',
  openai: Deno.env.get('OPENAI_API_KEY') || '',
  mapbox: Deno.env.get('MAPBOX_TOKEN') || '',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body to get the key parameter
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: error.message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { key } = requestData;
    
    // Log the request for debugging
    console.log(`API key requested: ${key}`);
    console.log(`Available keys: ${Object.keys(API_KEYS).join(', ')}`);
    
    if (!key) {
      return new Response(
        JSON.stringify({ 
          error: 'No key specified in request',
          validKeys: Object.keys(API_KEYS)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!Object.prototype.hasOwnProperty.call(API_KEYS, key)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid key requested: ${key}`,
          validKeys: Object.keys(API_KEYS)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const apiKey = API_KEYS[key];
    
    // Check if the key exists but has no value
    if (!apiKey) {
      console.warn(`Warning: Requested key '${key}' exists but has no value in environment variables`);
    }
    
    // Successfully return the API key
    return new Response(
      JSON.stringify({ key: apiKey }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Unexpected error in edge function:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
