
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
    // Parse request to get the zipcode
    const requestData = await req.json();
    const { zipcode } = requestData;
    
    if (!zipcode) {
      return new Response(
        JSON.stringify({ 
          error: "Missing zip code parameter" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    console.log(`Testing Census API for zip code: ${zipcode}`);
    
    // Get the Census API key from environment variable
    const CENSUS_API_KEY = Deno.env.get("CENSUS_API_KEY");
    if (!CENSUS_API_KEY) {
      throw new Error("Census API key not found in environment variables");
    }
    
    // First attempt to get data for the specific zip code using the ZCTA (ZIP Code Tabulation Areas)
    // Using the ACS5 profile data with similar variables to what we're currently using
    const zipcodeUrl = `https://api.census.gov/data/2022/acs/acs5/profile?get=NAME,DP05_0001E,DP05_0017E,DP03_0062E,DP03_0009PE,DP04_0089E,DP02_0066PE,DP02_0067PE&for=zip%20code%20tabulation%20area:${zipcode}&key=${CENSUS_API_KEY}`;
    
    console.log("Census API URL for zip code:", zipcodeUrl);
    
    const response = await fetch(zipcodeUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Census API error for zip code ${zipcode}: ${response.status} - ${errorText}`);
      
      // Try the alternative format - sometimes the Census API expects different parameter formats
      const altUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01001_001E,B19013_001E,B25077_001E&for=zip%20code%20tabulation%20area:${zipcode}&key=${CENSUS_API_KEY}`;
      
      console.log("Trying alternative URL format:", altUrl);
      
      const altResponse = await fetch(altUrl);
      if (!altResponse.ok) {
        console.error(`Alternative Census API also failed: ${altResponse.status}`);
        
        // Try one more format that uses "zcta" instead of "zip code tabulation area"
        const zctaUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01001_001E,B19013_001E,B25077_001E&for=zcta:${zipcode}&key=${CENSUS_API_KEY}`;
        
        console.log("Trying ZCTA format:", zctaUrl);
        
        const zctaResponse = await fetch(zctaUrl);
        if (!zctaResponse.ok) {
          console.error(`ZCTA format also failed: ${zctaResponse.status}`);
          return new Response(
            JSON.stringify({
              error: "Failed to retrieve census data for the provided zip code",
              details: errorText,
              zipcode
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500
            }
          );
        }
        
        const zctaData = await zctaResponse.json();
        return new Response(
          JSON.stringify({
            message: "Successfully retrieved census data using ZCTA format",
            data: zctaData,
            url: zctaUrl,
            zipcode
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const altData = await altResponse.json();
      return new Response(
        JSON.stringify({
          message: "Successfully retrieved census data using alternative format",
          data: altData,
          url: altUrl,
          zipcode
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        message: "Successfully retrieved census data",
        data,
        url: zipcodeUrl,
        zipcode
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in test-census-zipcode function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
