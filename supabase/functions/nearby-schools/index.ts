
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

    if (!lat || !lon || !address) {
      return new Response(
        JSON.stringify({ error: 'Latitude, longitude, and address are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract zip code from address if possible
    const zipRegex = /\b\d{5}(?:-\d{4})?\b/;
    const zipMatch = address.match(zipRegex);
    const zip = zipMatch ? zipMatch[0] : null;
    
    // Extract state from address (assuming format like "City, ST ZIP")
    const stateRegex = /\b([A-Z]{2})\b/;
    const stateMatch = address.match(stateRegex);
    const state = stateMatch ? stateMatch[0] : null;
    
    // Construct API URL based on available data
    let apiUrl;
    
    if (zip) {
      // If we have a zip code, use that (primary approach)
      apiUrl = `https://gs-api.greatschools.org/v2/schools?zip=${zip}&limit=25`;
      console.log(`Using zip code search with: ${zip}`);
    } else if (state) {
      // If we have a state but no zip, try to extract city and use city+state
      // This is a simplified approach and might need refinement
      const cityMatch = address.match(/([^,]+),/);
      const city = cityMatch ? cityMatch[1].trim() : null;
      
      if (city) {
        apiUrl = `https://gs-api.greatschools.org/v2/schools?city=${encodeURIComponent(city)}&state=${state}&limit=25`;
        console.log(`Using city/state search with: ${city}, ${state}`);
      } else {
        // Fallback to nearby schools endpoint if we can't extract proper parameters
        return new Response(
          JSON.stringify({ 
            error: 'Could not extract city and state from address', 
            message: "The address format couldn't be parsed correctly."
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // We couldn't extract needed parameters
      return new Response(
        JSON.stringify({ 
          error: 'Invalid address format', 
          message: "Could not extract zip code or city/state from the provided address."
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Calling GreatSchools API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content': 'application/json',
        'X-API-Key': API_KEY
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

    // Transform the data to match our expected School type interface
    const formattedSchools = schoolsData.schools?.map(school => {
      return {
        id: school['universal-id'] || null,
        name: school.name,
        type: school.type,
        educationLevel: mapLevelCodes(school['level-codes']),
        grades: {
          range: parseGrades(school.level)
        },
        enrollment: null, // API doesn't provide enrollment in this response
        ratings: {
          overall: parseRatingBand(school.rating_band)
        },
        location: {
          address: {
            streetAddress: school.street,
            city: school.city,
            state: school.state,
            zipCode: school.zip
          },
          distanceMiles: null, // Distance will be calculated in a different endpoint
          coordinates: {
            latitude: school.lat,
            longitude: school.lon
          }
        },
        district: school['district-name'] ? {
          id: school['district-id']?.toString() || null,
          name: school['district-name']
        } : null,
        phone: school.phone,
        links: {
          website: school['web-site'],
          profile: school['overview-url']
        }
      };
    }) || [];

    // Return the data with detailed information
    return new Response(
      JSON.stringify({
        schools: formattedSchools,
        searchedAddress: address,
        coordinates: { lat, lon },
        radiusMiles: radius,
        totalResults: formattedSchools.length
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

// Helper functions to map API data to our schema

function mapLevelCodes(levelCodes) {
  if (!levelCodes) return null;
  
  const codes = levelCodes.split(',');
  
  if (codes.includes('h')) return 'High School';
  if (codes.includes('m')) return 'Middle School';
  if (codes.includes('e')) return 'Elementary School';
  if (codes.includes('p')) return 'Preschool';
  
  return null;
}

function parseGrades(levelString) {
  if (!levelString) return { low: '', high: '' };
  
  const grades = levelString.split(',').filter(g => g !== 'UG' && g !== 'PK');
  
  if (grades.length === 0) return { low: '', high: '' };
  
  return {
    low: grades[0],
    high: grades[grades.length - 1]
  };
}

function parseRatingBand(ratingBand) {
  if (!ratingBand || ratingBand === 'null') return null;
  
  // Convert rating bands to numeric values
  switch (ratingBand) {
    case 'Well above average':
      return 5;
    case 'Above average':
      return 4;
    case 'Average':
      return 3;
    case 'Below average':
      return 2;
    case 'Well below average':
      return 1;
    default:
      return null;
  }
}
