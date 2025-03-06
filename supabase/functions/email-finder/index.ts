
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const HUNTER_API_KEY = Deno.env.get('HUNTERIO_API_KEY') || '';

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
    const { domain, company, first_name, last_name, full_name, max_duration } = await req.json();
    
    // Validate required parameters
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if ((!first_name || !last_name) && !full_name) {
      return new Response(
        JSON.stringify({ error: 'Either first_name and last_name, or full_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('domain', domain);
    queryParams.append('api_key', HUNTER_API_KEY);
    
    if (company) queryParams.append('company', company);
    if (first_name) queryParams.append('first_name', first_name);
    if (last_name) queryParams.append('last_name', last_name);
    if (full_name) queryParams.append('full_name', full_name);
    if (max_duration) queryParams.append('max_duration', max_duration.toString());
    
    console.log(`Finding email for ${first_name || ''} ${last_name || ''} at domain: ${domain}`);
    
    const response = await fetch(`https://api.hunter.io/v2/email-finder?${queryParams.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Hunter API error:', data);
      return new Response(
        JSON.stringify({ error: data.errors?.[0]?.details || 'Failed to find email' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Email found for ${first_name || ''} ${last_name || ''} at domain ${domain}`);
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in email-finder function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
