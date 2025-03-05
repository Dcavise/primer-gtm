
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./constants.ts";
import { geocodeAddress } from "./geocoding.ts";
import { getFipsCodesFromCoordinates } from "./fips-utils.ts";
import { findCensusBlockGroupsInRadius, processCensusData } from "./census-api.ts";
import { getMockCensusData } from "./mock-data.ts";
import { CensusData, CensusResponse } from "./types.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    const { address } = requestData;

    if (!address) {
      throw new Error("Address is required");
    }

    console.log(`Processing census data request for address: ${address}`);

    // Step 1: Geocode the address
    const geocoded = await geocodeAddress(address);
    
    if (!geocoded) {
      console.error("Failed to geocode address:", address);
      return new Response(
        JSON.stringify({
          error: "Could not geocode the address",
          isMockData: true,
          data: getMockCensusData(),
          searchedAddress: address,
          tractsIncluded: 0,
          blockGroupsIncluded: 0,
          radiusMiles: 5
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Geocoded address to: ${geocoded.lat}, ${geocoded.lng}`);

    // Step 2: Get FIPS codes for the location
    const fipsCodes = await getFipsCodesFromCoordinates(geocoded.lat, geocoded.lng);
    
    if (!fipsCodes) {
      console.error("Could not determine FIPS codes for location");
      return new Response(
        JSON.stringify({
          error: "Could not determine geographic location",
          isMockData: true,
          data: getMockCensusData(),
          searchedAddress: geocoded.formattedAddress || address,
          tractsIncluded: 0,
          blockGroupsIncluded: 0,
          radiusMiles: 5
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Identified location in state FIPS ${fipsCodes.stateFips}, county FIPS ${fipsCodes.countyFips}`);

    // Step 3: Get census data within 5 miles
    const radiusMiles = 5;
    
    // Try block groups first (more detailed)
    const blockGroupsInRadius = await findCensusBlockGroupsInRadius(
      { lat: geocoded.lat, lng: geocoded.lng },
      radiusMiles,
      fipsCodes.stateFips,
      fipsCodes.countyFips
    );

    // Process the data
    let censusData: CensusData | null = null;
    let response: CensusResponse;

    // Log block groups info to help debug
    console.log(`Found ${blockGroupsInRadius?.length || 0} block groups within radius`);
    
    if (blockGroupsInRadius && blockGroupsInRadius.length > 0) {
      // Process block group data
      censusData = await processCensusData(blockGroupsInRadius, radiusMiles);
      
      if (censusData) {
        console.log("Successfully processed census data, returning real data");
        response = {
          data: censusData,
          tractsIncluded: 0,
          blockGroupsIncluded: blockGroupsInRadius.length,
          radiusMiles,
          searchedAddress: geocoded.formattedAddress || address,
          isMockData: false // Explicitly set to false when we have real data
        };
      } else {
        // Fallback to mock data
        console.log("Could not process block group data, using mock data");
        response = {
          data: getMockCensusData(),
          tractsIncluded: 0,
          blockGroupsIncluded: 0,
          radiusMiles,
          searchedAddress: geocoded.formattedAddress || address,
          isMockData: true,
          error: "Failed to process census data"
        };
      }
    } else {
      // Use mock data as fallback
      console.log("No block groups found within radius, using mock data");
      response = {
        data: getMockCensusData(),
        tractsIncluded: 0,
        blockGroupsIncluded: 0,
        radiusMiles,
        searchedAddress: geocoded.formattedAddress || address,
        isMockData: true,
        error: "No census geographies found within 5 miles"
      };
    }

    // Log the final response structure to help debug
    console.log(`Returning response with isMockData: ${response.isMockData}, blockGroupsIncluded: ${response.blockGroupsIncluded}`);

    // Return the response
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in census-data function:", error);
    
    // Return an error response with mock data
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred",
        isMockData: true,
        data: getMockCensusData(),
        tractsIncluded: 0,
        blockGroupsIncluded: 0,
        radiusMiles: 5
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
