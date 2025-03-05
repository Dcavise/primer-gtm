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
  records: SalesforceOpportunity[];
  nextRecordsUrl?: string;
}

interface SalesforceOpportunity {
  Id: string;
  Name: string;
  StageName: string;
  CloseDate: string;
  AccountId: string;
  [key: string]: any;
}

interface SupabaseOpportunity {
  opportunity_id: string;
  opportunity_name: string | null;
  stage: string | null;
  close_date: string | null;
  account_id: string | null;
  lead_id: string;
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

// Query Salesforce for all opportunities
async function fetchSalesforceOpportunities(token: string, instanceUrl: string): Promise<SalesforceOpportunity[]> {
  console.log("Fetching all Salesforce opportunities...");
  
  // Query only standard fields that we know exist in every Salesforce org
  const query = `
    SELECT Id, Name, StageName, CloseDate, AccountId 
    FROM Opportunity
    WHERE Id != null
    ORDER BY CreatedDate DESC
    LIMIT 1000
  `;
  
  console.log("SOQL Query:", query);
  
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
    throw new Error(`Failed to fetch Salesforce opportunities: ${response.status} ${errorText}`);
  }

  const data: SalesforceQueryResponse = await response.json();
  console.log(`Retrieved ${data.records.length} opportunities from Salesforce`);
  return data.records;
}

// Find corresponding leads for opportunities
async function findLeadsForOpportunities(opportunities: SalesforceOpportunity[]): Promise<Map<string, string>> {
  console.log("Finding corresponding leads for opportunities...");
  
  // Get all leads with converted_opportunity_id values
  const { data, error } = await supabase
    .from('salesforce_leads')
    .select('lead_id, converted_opportunity_id')
    .not('converted_opportunity_id', 'is', null);
  
  if (error) {
    console.error("Error fetching leads with opportunity IDs:", error);
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }
  
  // Create a mapping of opportunity IDs to lead IDs
  const opportunityToLeadMap = new Map<string, string>();
  for (const lead of data) {
    if (lead.converted_opportunity_id) {
      opportunityToLeadMap.set(lead.converted_opportunity_id, lead.lead_id);
    }
  }
  
  console.log(`Found ${opportunityToLeadMap.size} lead-opportunity mappings`);
  return opportunityToLeadMap;
}

// Transform Salesforce opportunities to Supabase format
async function transformOpportunities(
  salesforceOpportunities: SalesforceOpportunity[]
): Promise<SupabaseOpportunity[]> {
  console.log(`Transforming ${salesforceOpportunities.length} Salesforce opportunities...`);
  
  // Get mapping of opportunities to leads
  const opportunityToLeadMap = await findLeadsForOpportunities(salesforceOpportunities);
  
  // Transform the opportunities
  const transformedOpportunities = salesforceOpportunities.map(opp => {
    // Find the lead ID for this opportunity (if any)
    const leadId = opportunityToLeadMap.get(opp.Id) || 'unknown';
    
    const closeDate = opp.CloseDate ? opp.CloseDate : null;
    
    return {
      opportunity_id: opp.Id,
      opportunity_name: opp.Name || null,
      stage: opp.StageName || null,
      close_date: closeDate,
      account_id: opp.AccountId || null,
      lead_id: leadId
    };
  });
  
  // Only keep opportunities that we have a lead for
  const filteredOpportunities = transformedOpportunities.filter(opp => opp.lead_id !== 'unknown');
  
  console.log(`Filtered to ${filteredOpportunities.length} opportunities with matching leads`);
  return filteredOpportunities;
}

// Upsert opportunities to Supabase
async function syncOpportunitiesToSupabase(opportunities: SupabaseOpportunity[]): Promise<number> {
  console.log(`Syncing ${opportunities.length} opportunities to Supabase...`);
  
  if (opportunities.length === 0) {
    console.log("No opportunities to sync");
    return 0;
  }
  
  const { data, error } = await supabase
    .from('salesforce_opportunities')
    .upsert(opportunities, { 
      onConflict: 'opportunity_id',
      ignoreDuplicates: false,
      returning: 'minimal'
    })
    .select();
  
  if (error) {
    console.error("Supabase upsert error:", error);
    throw new Error(`Failed to sync opportunities to Supabase: ${error.message}`);
  }
  
  console.log(`Successfully synced ${data?.length || 0} opportunities`);
  return data?.length || 0;
}

// Main sync function
async function syncSalesforceOpportunities(): Promise<{ 
  success: boolean; 
  synced: number; 
  error?: string 
}> {
  try {
    const authResponse = await getSalesforceToken();
    
    const salesforceOpportunities = await fetchSalesforceOpportunities(
      authResponse.access_token, 
      authResponse.instance_url
    );
    
    const transformedOpportunities = await transformOpportunities(salesforceOpportunities);
    
    const syncedCount = await syncOpportunitiesToSupabase(transformedOpportunities);
    
    return { 
      success: true, 
      synced: syncedCount
    };
  } catch (error) {
    console.error("Error syncing Salesforce opportunities:", error);
    return { 
      success: false, 
      synced: 0, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Handle requests
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    let options = {};
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        options = body;
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    console.log("Starting Salesforce opportunities sync...");
    const result = await syncSalesforceOpportunities();
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
