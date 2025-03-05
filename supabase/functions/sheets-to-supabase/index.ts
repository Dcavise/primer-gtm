
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser requests
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
    console.log("Starting sheets-to-supabase function");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found');
      throw new Error('Supabase credentials not found');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized");

    // Get request data
    const data = await req.json();
    
    if (!data || !data.apiKey || !data.properties) {
      console.error("Missing required data in request");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required data" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Simple API key validation (key stored in environment)
    const validApiKey = Deno.env.get('SHEETS_API_KEY') || '';
    if (!validApiKey || data.apiKey !== validApiKey) {
      console.error("Invalid API key");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid API key" 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Log the number of properties being processed
    console.log(`Processing ${data.properties.length} properties from Google Sheets`);
    
    // Process records - add a timestamp
    const properties = data.properties.map((property: any) => ({
      ...property,
      last_updated: new Date().toISOString()
    }));
    
    // Log the first property for debugging
    if (properties.length > 0) {
      console.log("Sample property:", JSON.stringify(properties[0]));
    }
    
    // Clear existing data if requested
    if (data.clearExisting === true) {
      console.log("Clearing existing records per request");
      const { error: deleteError } = await supabase
        .from('real_estate_pipeline')
        .delete()
        .not('id', 'is', null);
      
      if (deleteError) {
        console.error("Error clearing existing records:", deleteError);
        throw deleteError;
      }
    }
    
    // Insert the records into Supabase
    console.log(`Inserting ${properties.length} records to Supabase`);
    const { data: insertedData, error: insertError } = await supabase
      .from('real_estate_pipeline')
      .insert(properties)
      .select('id');
    
    if (insertError) {
      console.error("Error inserting records:", insertError);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${insertedData.length} records`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${insertedData.length} real estate records`,
        inserted: insertedData.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error("Error in sheets-to-supabase function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
