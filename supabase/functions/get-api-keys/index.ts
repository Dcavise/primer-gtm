
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
    const { key } = await req.json();
    
    if (!key || !API_KEYS[key]) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid key requested',
          validKeys: Object.keys(API_KEYS)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Successfully return the API key
    return new Response(
      JSON.stringify({ key: API_KEYS[key] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
