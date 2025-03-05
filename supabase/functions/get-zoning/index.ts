
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Fallback zoning data in case the API is unavailable
const fallbackZoningData = {
  success: true,
  data: {
    zone_details: {
      zone_name: "Residential Single-Family",
      zone_code: "RS-3",
      zone_type: "Residential",
      zone_sub_type: "Single-Family",
      zone_guide: "Residential Single-Family district is intended to accommodate detached houses on individual lots."
    },
    permitted_land_uses: {
      as_of_right: [
        "Single-Family Residential",
        "Parks and Recreation",
        "Community Gardens",
        "Religious Assembly",
        "Schools"
      ],
      conditional_uses: [
        "Daycare Centers",
        "Cultural Exhibits and Libraries",
        "Public Safety Services",
        "Utilities and Services"
      ],
      prohibited: [
        "Multi-Family Residential",
        "Commercial Uses",
        "Industrial Uses",
        "Warehousing"
      ]
    },
    controls: {
      standard: {
        min_lot_area: "2,500 sq ft",
        max_building_height: "30 ft",
        max_floor_area_ratio: "0.9",
        min_lot_width: "25 ft",
        front_setback: "20 ft",
        side_setback: "3 ft",
        rear_setback: "28 ft"
      }
    },
    meta: {
      last_updated: "2023-07-15T00:00:00Z"
    }
  },
  message: "Fallback data provided due to API unavailability"
};

serve(async (req) => {
  console.log("Processing get-zoning request");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request to get parameters
    let params;
    if (req.method === 'POST') {
      params = await req.json();
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      params = Object.fromEntries(url.searchParams);
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use GET or POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for required parameters
    if (!params.address && !(params.lat && params.lng)) {
      console.error("Missing required parameters: address or lat/lng");
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: address or lat/lng coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the ZoneOmics API key
    const zoneomicsApiKey = Deno.env.get("ZONEOMICS_API_KEY");
    
    if (!zoneomicsApiKey) {
      console.error("No ZoneOmics API key found in environment variables");
      return new Response(
        JSON.stringify({ 
          error: 'ZoneOmics API key not configured',
          details: 'Please configure the ZONEOMICS_API_KEY in Supabase secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the API request
    const queryParams = new URLSearchParams({
      api_key: zoneomicsApiKey,
    });

    if (params.lat && params.lng) {
      queryParams.append("lat", params.lat.toString());
      queryParams.append("lng", params.lng.toString());
    }

    if (params.address) {
      queryParams.append("address", params.address);
    }

    if (params.output_fields) {
      queryParams.append("output_fields", params.output_fields);
    }

    if (params.group_plu) {
      queryParams.append("group_plu", params.group_plu);
    }

    if (params.replace_STF !== undefined) {
      queryParams.append("replace_STF", params.replace_STF.toString());
    }
    
    const apiUrl = `https://api.zoneomics.com/v2/zoneDetail?${queryParams}`;
    console.log(`Making request to ZoneOmics API: ${apiUrl.replace(zoneomicsApiKey, '[REDACTED]')}`);
    
    // Set a timeout for the API request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`ZoneOmics API error: ${response.status} - ${response.statusText}`);
        
        // Try to get error details from response
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          errorDetails = await response.text();
        }
        
        console.error("ZoneOmics API error details:", errorDetails);
        return new Response(
          JSON.stringify(fallbackZoningData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const data = await response.json();
      console.log("ZoneOmics API response received");
      
      if (!data || typeof data.success !== 'boolean') {
        console.error("Invalid response format from ZoneOmics API");
        return new Response(
          JSON.stringify(fallbackZoningData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      console.error("Error fetching from ZoneOmics API:", fetchError);
      return new Response(
        JSON.stringify(fallbackZoningData),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error in get-zoning function:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
