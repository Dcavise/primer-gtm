
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Mock data for fallback when the API is unavailable
const fallbackPermitData = {
  permits: [
    {
      id: "permit-1",
      record_id: "BLD-2023-12345",
      applicant: "Smith Construction Inc.",
      project_type: "Building",
      address: "Sample Address",
      postcode: "12345",
      city: "Sample City",
      state: "ST",
      project_brief: "New roof installation with additional insulation",
      project_name: "Residential Roof Replacement",
      status: "Approved",
      date: new Date().toISOString(),
      created_date: new Date().toISOString(),
      last_updated_date: new Date().toISOString(),
      applicant_contact: "John Smith",
      record_link: "#",
      contact_phone_number: "555-123-4567",
      contact_email: "info@example.com",
      source: "Sample Data",
      pin: {
        location: {
          lat: "40.7128",
          lon: "-74.0060"
        }
      },
      latitude: "40.7128",
      longitude: "-74.0060",
      department_id: "",
      zoning_classification_pre: "",
      zoning_classification_post: "",
      document_link: "",
      contact_website: "",
      parcel_number: "",
      block: "",
      lot: "",
      owner: "",
      authority: "",
      owner_address: "",
      owner_phone: "",
      comments: "",
      remarks: "",
      suburb: ""
    },
    {
      id: "permit-2",
      record_id: "PLM-2023-67890",
      applicant: "City Plumbing Co.",
      project_type: "Plumbing",
      address: "Sample Address",
      postcode: "12345",
      city: "Sample City",
      state: "ST",
      project_brief: "Replace water heater and update pipes to code",
      project_name: "Plumbing Update",
      status: "In Review",
      date: new Date().toISOString(),
      created_date: new Date().toISOString(),
      last_updated_date: new Date().toISOString(),
      applicant_contact: "Alice Jones",
      record_link: "#",
      contact_phone_number: "555-987-6543",
      contact_email: "service@example.com",
      source: "Sample Data",
      pin: {
        location: {
          lat: "40.7128",
          lon: "-74.0060"
        }
      },
      latitude: "40.7128",
      longitude: "-74.0060",
      department_id: "",
      zoning_classification_pre: "",
      zoning_classification_post: "",
      document_link: "",
      contact_website: "",
      parcel_number: "",
      block: "",
      lot: "",
      owner: "",
      authority: "",
      owner_address: "",
      owner_phone: "",
      comments: "",
      remarks: "",
      suburb: ""
    }
  ],
  total: 2
};

serve(async (req) => {
  console.log("Processing get-permits request");
  
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
    const requiredParams = ['bottom_left_lat', 'bottom_left_lng', 'top_right_lat', 'top_right_lng'];
    const missingParams = requiredParams.filter(param => !params[param]);
    
    if (missingParams.length > 0) {
      console.error(`Missing required parameters: ${missingParams.join(', ')}`);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters',
          details: `The following parameters are required: ${missingParams.join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the ZoneOmics API key
    const zoneomicsApiKey = Deno.env.get("ZONEOMICS_API_KEY");
    
    if (!zoneomicsApiKey) {
      console.error("No ZoneOmics API key found in environment variables");
      
      // For permits, customize the fallback data with the exact address if provided
      if (params.exact_address) {
        const customFallbackData = {
          ...fallbackPermitData,
          permits: fallbackPermitData.permits.map(permit => ({
            ...permit,
            address: params.exact_address
          }))
        };
        
        return new Response(
          JSON.stringify(customFallbackData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(fallbackPermitData),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the API request
    const queryParams = new URLSearchParams({
      api_key: zoneomicsApiKey,
      bottom_left_lat: params.bottom_left_lat.toString(),
      bottom_left_lng: params.bottom_left_lng.toString(),
      top_right_lat: params.top_right_lat.toString(),
      top_right_lng: params.top_right_lng.toString()
    });
    
    const apiUrl = `https://api.zoneomics.com/v2/zonePermits?${queryParams}`;
    console.log(`Making request to ZoneOmics API: ${apiUrl.replace(zoneomicsApiKey, '[REDACTED]')}`);
    console.log(`Fetching permits with coordinates: (${params.bottom_left_lat}, ${params.bottom_left_lng}) to (${params.top_right_lat}, ${params.top_right_lng})`);
    
    // Set a timeout for the API request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`ZoneOmics Permits API error: ${response.status} - ${response.statusText}`);
        
        // Try to get error details from response
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          errorDetails = await response.text();
        }
        
        console.error("ZoneOmics Permits API error details:", errorDetails);
        
        // Return fallback data, customized with exact address if provided
        if (params.exact_address) {
          const customFallbackData = {
            ...fallbackPermitData,
            permits: fallbackPermitData.permits.map(permit => ({
              ...permit,
              address: params.exact_address
            }))
          };
          
          return new Response(
            JSON.stringify(customFallbackData),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify(fallbackPermitData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const data = await response.json();
      console.log(`API returned ${data.data?.length || 0} permits`);
      
      // Process the API data
      const processedPermits = (data.data || []).map((permit) => {
        return {
          id: permit.id || `permit-${Math.random().toString(36).substring(7)}`,
          record_id: permit.record_id || "",
          applicant: permit.applicant || "",
          project_type: permit.project_type || "",
          address: permit.address || "",
          postcode: permit.postcode || "",
          city: permit.city || "",
          state: permit.state || "",
          project_brief: permit.project_brief || "",
          project_name: permit.project_name || "",
          status: permit.status || "",
          date: permit.date || permit.created_date || permit.last_updated_date || new Date().toISOString(),
          created_date: permit.created_date || new Date().toISOString(),
          last_updated_date: permit.last_updated_date || new Date().toISOString(),
          applicant_contact: permit.applicant_contact || "",
          record_link: permit.record_link || "",
          contact_phone_number: permit.contact_phone_number || "",
          contact_email: permit.contact_email || "",
          source: permit.source || "Zoneomics API",
          pin: permit.pin || { location: { lat: permit.latitude || "0", lon: permit.longitude || "0" } },
          latitude: permit.latitude || "0",
          longitude: permit.longitude || "0",
          department_id: permit.department_id || "",
          zoning_classification_pre: permit.zoning_classification_pre || "",
          zoning_classification_post: permit.zoning_classification_post || "",
          document_link: permit.document_link || "",
          contact_website: permit.contact_website || "",
          parcel_number: permit.parcel_number || "",
          block: permit.block || "",
          lot: permit.lot || "",
          owner: permit.owner || "",
          authority: permit.authority || "",
          owner_address: permit.owner_address || "",
          owner_phone: permit.owner_phone || "",
          comments: permit.comments || "",
          remarks: permit.remarks || "",
          suburb: permit.suburb || ""
        };
      });
      
      // Filter for exact address matches if exact_address is provided
      let finalPermits = processedPermits;
      if (params.exact_address && processedPermits.length > 0) {
        const exactAddress = params.exact_address.toLowerCase().trim();
        const exactMatches = processedPermits.filter((permit) => {
          if (!permit.address) return false;
          return permit.address.toLowerCase().trim() === exactAddress;
        });
        
        console.log(`Found ${exactMatches.length} exact address matches for "${exactAddress}"`);
        finalPermits = exactMatches;
      }
      
      const result = {
        permits: finalPermits,
        total: finalPermits.length
      };
      
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      console.error("Error fetching from ZoneOmics Permits API:", fetchError);
      
      // Return fallback data, customized with exact address if provided
      if (params.exact_address) {
        const customFallbackData = {
          ...fallbackPermitData,
          permits: fallbackPermitData.permits.map(permit => ({
            ...permit,
            address: params.exact_address
          }))
        };
        
        return new Response(
          JSON.stringify(customFallbackData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(fallbackPermitData),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error in get-permits function:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
