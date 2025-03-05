
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
    const { domain, limit, department, seniority, type } = await req.json();
    
    if (!domain || domain.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Domain is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('domain', domain);
    queryParams.append('api_key', HUNTER_API_KEY);
    
    if (limit) queryParams.append('limit', limit.toString());
    if (department) queryParams.append('department', department);
    if (seniority) queryParams.append('seniority', seniority);
    if (type) queryParams.append('type', type);
    
    console.log(`Searching for contacts on domain: ${domain}`);
    
    const response = await fetch(`https://api.hunter.io/v2/domain-search?${queryParams.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Hunter API error:', data);
      return new Response(
        JSON.stringify({ error: data.errors?.[0]?.details || 'Failed to fetch contacts' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${data.data?.emails?.length || 0} contacts for domain ${domain}`);
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in domain-search function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
