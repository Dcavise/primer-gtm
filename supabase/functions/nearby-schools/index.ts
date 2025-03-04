
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
    const API_KEY = Deno.env.get('GREATSCHOOLS_API_KEY');
    
    if (!API_KEY) {
      console.error('GREATSCHOOLS_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request parameters
    const { lat, lon, address, radius = 5 } = await req.json();
    console.log(`Searching for schools near: ${address} (${lat}, ${lon}), radius: ${radius}mi`);

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Make request to GreatSchools API
    const apiUrl = `https://gs-api.greatschools.org/nearby-schools?lat=${lat}&lon=${lon}&distance=${radius}&limit=25`;
    console.log(`Calling GreatSchools API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GreatSchools API error: ${response.status} - ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          error: `GreatSchools API error: ${response.status}`, 
          details: errorText,
          message: "Failed to fetch nearby schools data"
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const schoolsData = await response.json();
    console.log(`Found ${schoolsData.schools?.length || 0} schools near ${address}`);

    // Return the data with detailed information
    return new Response(
      JSON.stringify({
        schools: schoolsData.schools || [],
        searchedAddress: address,
        coordinates: { lat, lon },
        radiusMiles: radius,
        totalResults: schoolsData.schools?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in nearby-schools function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        message: "An unexpected error occurred while fetching school data"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
