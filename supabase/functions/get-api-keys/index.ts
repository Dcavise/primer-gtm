
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const API_KEYS = {
  google_maps: Deno.env.get('GOOGLE_MAPS_API_KEY') || Deno.env.get('GOOGLE_API_KEY') || '',
  zoneomics: Deno.env.get('ZONEOMICS_API_KEY') || '',
  census: Deno.env.get('CENSUS_API_KEY') || '',
  greatschools: Deno.env.get('GREATSCHOOLS_API_KEY') || '',
  openai: Deno.env.get('OPENAI_API_KEY') || '',
  mapbox: Deno.env.get('MAPBOX_TOKEN') || '',
};

serve(async (req) => {
  console.log(`Request method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body or URL parameters to get the key parameter
    let keyName = '';
    
    if (req.method === 'POST') {
      try {
        const requestData = await req.json();
        keyName = requestData.key || '';
        console.log(`POST request with key param: ${keyName}`);
      } catch (error) {
        console.error("Error parsing JSON from POST request:", error);
        // If JSON parsing failed but we still have a body, try to handle it as text
        try {
          const text = await req.text();
          console.log("Raw request body:", text);
          
          // Attempt to extract key from text that might be JSON-like
          const keyMatch = text.match(/"key"\s*:\s*"([^"]+)"/);
          if (keyMatch && keyMatch[1]) {
            keyName = keyMatch[1];
            console.log(`Extracted key from malformed JSON: ${keyName}`);
          }
        } catch (textError) {
          console.error("Error reading request body as text:", textError);
        }
      }
    } else if (req.method === 'GET') {
      // Extract key from URL parameters
      const url = new URL(req.url);
      keyName = url.searchParams.get('key') || '';
      console.log(`GET request with key param: ${keyName}`);
    }
    
    // Validate the key parameter
    if (!keyName) {
      console.error("No key parameter provided in request");
      return new Response(
        JSON.stringify({ 
          error: 'No key specified in request',
          validKeys: Object.keys(API_KEYS),
          help: 'Send a POST request with JSON body {"key": "keyname"} or GET request with ?key=keyname'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log all available environment variables (without values) for debugging
    console.log("Available environment variables:");
    for (const key of ["GOOGLE_API_KEY", "GOOGLE_MAPS_API_KEY", "MAPS_PLATFORM_API_KEY"]) {
      console.log(`- ${key}: ${Deno.env.has(key) ? "Present" : "Not found"}`);
    }
    
    // Check if the requested key exists in our API_KEYS object
    if (!Object.prototype.hasOwnProperty.call(API_KEYS, keyName)) {
      console.error(`Invalid key requested: ${keyName}`);
      return new Response(
        JSON.stringify({ 
          error: `Invalid key requested: ${keyName}`,
          validKeys: Object.keys(API_KEYS),
          help: `Valid keys are: ${Object.keys(API_KEYS).join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const apiKey = API_KEYS[keyName];
    
    // For debugging, log the available keys and their statuses
    console.log("Available API keys:");
    for (const [key, value] of Object.entries(API_KEYS)) {
      console.log(`- ${key}: ${value ? 'Has value' : 'No value'}`);
    }
    
    // Check if the key exists but has no value
    if (!apiKey) {
      console.warn(`Warning: Requested key '${keyName}' exists but has no value in environment variables`);
    }
    
    // Successfully return the API key
    console.log(`Successfully returned API key for: ${keyName}`);
    return new Response(
      JSON.stringify({ key: apiKey }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Unexpected error in edge function:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
