
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { key } = await req.json();
    
    // Only allow specific keys to be retrieved
    let apiKey = null;
    
    switch(key) {
      case 'zoneomics':
        apiKey = Deno.env.get('ZONEOMICS_API_KEY');
        break;
      case 'google_maps':
        apiKey = Deno.env.get('GOOGLE_API_KEY');
        break;
      case 'census':
        apiKey = Deno.env.get('CENSUS_API_KEY');
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid key requested' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    if (!apiKey) {
      console.error(`API key not found: ${key}`);
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ apiKey }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-api-keys function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
