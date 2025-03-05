
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SALESFORCE_CLIENT_ID = Deno.env.get('SALESFORCE_CLIENT_ID') || '';
const SALESFORCE_CLIENT_SECRET = Deno.env.get('SALESFORCE_CLIENT_SECRET') || '';
const SALESFORCE_USERNAME = Deno.env.get('SALESFORCE_USERNAME') || '';
const SALESFORCE_PASSWORD = Deno.env.get('SALESFORCE_PASSWORD') || '';
const SALESFORCE_SECURITY_TOKEN = Deno.env.get('SALESFORCE_SECURITY_TOKEN') || '';

// Initialize the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface SalesforceAuthResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

interface SalesforceQueryResponse {
  totalSize: number;
  done: boolean;
  records: SalesforceLead[];
  nextRecordsUrl?: string;
}

interface SalesforceLead {
  Id: string;
  FirstName: string;
  LastName: string;
  CreatedDate: string;
  ConvertedDate: string | null;
  IsConverted: boolean;
  Status: string;
  LeadSource: string | null;
  Company?: string | null;
  [key: string]: any;
}

interface SupabaseLead {
  lead_id: string;
  first_name: string | null;
  last_name: string;
  created_date: string | null;
  converted_date: string | null;
  converted: boolean | null;
  stage: string | null;
  lead_source: string | null;
  preferred_campus: string | null;
  campus_id: string | null;
}

// Get Salesforce OAuth token
async function getSalesforceToken(): Promise<SalesforceAuthResponse> {
  console.log("Getting Salesforce OAuth token...");
  
  const tokenUrl = 'https://login.salesforce.com/services/oauth2/token';
  const formData = new URLSearchParams({
    'grant_type': 'password',
    'client_id': SALESFORCE_CLIENT_ID,
    'client_secret': SALESFORCE_CLIENT_SECRET,
    'username': SALESFORCE_USERNAME,
    'password': SALESFORCE_PASSWORD + SALESFORCE_SECURITY_TOKEN
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Salesforce auth error:", errorText);
    throw new Error(`Failed to get Salesforce token: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// Query Salesforce for leads
async function fetchSalesforceLeads(token: string, instanceUrl: string): Promise<SalesforceLead[]> {
  console.log("Fetching Salesforce leads...");
  
  const query = `
    SELECT Id, FirstName, LastName, CreatedDate, ConvertedDate, IsConverted, 
           Status, LeadSource, Company
    FROM Lead
    ORDER BY CreatedDate DESC
    LIMIT 100
  `;
  
  const encodedQuery = encodeURIComponent(query);
  const queryUrl = `${instanceUrl}/services/data/v58.0/query?q=${encodedQuery}`;
  
  const response = await fetch(queryUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Salesforce query error:", errorText);
    throw new Error(`Failed to fetch Salesforce leads: ${response.status} ${errorText}`);
  }

  const data: SalesforceQueryResponse = await response.json();
  return data.records;
}

// Transform Salesforce leads to Supabase format
function transformLeads(salesforceLeads: SalesforceLead[]): SupabaseLead[] {
  console.log(`Transforming ${salesforceLeads.length} Salesforce leads...`);
  
  return salesforceLeads.map(lead => {
    // Parse dates from Salesforce format
    const createdDate = lead.CreatedDate ? new Date(lead.CreatedDate).toISOString().split('T')[0] : null;
    const convertedDate = lead.ConvertedDate ? new Date(lead.ConvertedDate).toISOString().split('T')[0] : null;
    
    // Map lead status to stage
    const stage = lead.Status || null;
    
    // For demonstration, we'll extract campus info from the Company field
    // In a real implementation, you might have dedicated fields or a mapping logic
    let preferredCampus = null;
    let campusId = null;
    
    if (lead.Company) {
      // Simple example: If company contains "SF" or "San Francisco", map to San Francisco campus
      const companyLower = lead.Company.toLowerCase();
      if (companyLower.includes('sf') || companyLower.includes('san francisco')) {
        preferredCampus = 'San Francisco';
        // You would look up the actual campus_id from your campuses table
      }
      // Add more campus mappings as needed
    }
    
    return {
      lead_id: lead.Id,
      first_name: lead.FirstName || null,
      last_name: lead.LastName,
      created_date: createdDate,
      converted_date: convertedDate,
      converted: lead.IsConverted,
      stage: stage,
      lead_source: lead.LeadSource,
      preferred_campus: preferredCampus,
      campus_id: campusId
    };
  });
}

// Upsert leads to Supabase
async function syncLeadsToSupabase(leads: SupabaseLead[]): Promise<number> {
  console.log(`Syncing ${leads.length} leads to Supabase...`);
  
  const { data, error } = await supabase
    .from('salesforce_leads')
    .upsert(leads, { 
      onConflict: 'lead_id',
      ignoreDuplicates: false
    })
    .select();
  
  if (error) {
    console.error("Supabase upsert error:", error);
    throw new Error(`Failed to sync leads to Supabase: ${error.message}`);
  }
  
  console.log(`Successfully synced ${data?.length || 0} leads`);
  return data?.length || 0;
}

// Match leads with campuses
async function matchLeadsWithCampuses(): Promise<number> {
  console.log("Matching leads with campuses...");
  
  // Get all campuses
  const { data: campuses, error: campusError } = await supabase
    .from('campuses')
    .select('*');
  
  if (campusError) {
    console.error("Error fetching campuses:", campusError);
    throw new Error(`Failed to fetch campuses: ${campusError.message}`);
  }
  
  if (!campuses || campuses.length === 0) {
    console.log("No campuses found, skipping matching");
    return 0;
  }
  
  // Get leads without campus_id but with preferred_campus
  const { data: leads, error: leadsError } = await supabase
    .from('salesforce_leads')
    .select('*')
    .is('campus_id', null)
    .not('preferred_campus', 'is', null);
  
  if (leadsError) {
    console.error("Error fetching leads:", leadsError);
    throw new Error(`Failed to fetch leads: ${leadsError.message}`);
  }
  
  if (!leads || leads.length === 0) {
    console.log("No leads need campus matching");
    return 0;
  }
  
  let matchedCount = 0;
  
  // For each lead, try to find a matching campus
  for (const lead of leads) {
    if (!lead.preferred_campus) continue;
    
    // Find the best matching campus
    const matchingCampus = campuses.find(campus => 
      campus.campus_name.toLowerCase() === lead.preferred_campus?.toLowerCase()
    );
    
    if (matchingCampus) {
      // Update the lead with the campus_id
      const { error: updateError } = await supabase
        .from('salesforce_leads')
        .update({ campus_id: matchingCampus.campus_id })
        .eq('id', lead.id);
      
      if (updateError) {
        console.error(`Error updating lead ${lead.id}:`, updateError);
      } else {
        matchedCount++;
      }
    }
  }
  
  console.log(`Matched ${matchedCount} leads with campuses`);
  return matchedCount;
}

// Main sync function
async function syncSalesforceLeads(): Promise<{ success: boolean; synced: number; matched?: number; error?: string }> {
  try {
    // Get Salesforce auth token
    const authResponse = await getSalesforceToken();
    
    // Fetch leads from Salesforce
    const salesforceLeads = await fetchSalesforceLeads(
      authResponse.access_token, 
      authResponse.instance_url
    );
    
    // Transform leads to Supabase format
    const transformedLeads = transformLeads(salesforceLeads);
    
    // Sync leads to Supabase
    const syncedCount = await syncLeadsToSupabase(transformedLeads);
    
    // Match leads with campuses
    const matchedCount = await matchLeadsWithCampuses();
    
    return { 
      success: true, 
      synced: syncedCount,
      matched: matchedCount
    };
  } catch (error) {
    console.error("Error syncing Salesforce leads:", error);
    return { 
      success: false, 
      synced: 0, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Handle requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // For manual triggering with parameters
    let options = {};
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        options = body;
      } catch (e) {
        // If JSON parsing fails, use empty options
      }
    }
    
    console.log("Starting Salesforce leads sync...");
    const result = await syncSalesforceLeads();
    console.log("Sync complete:", result);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
