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
  records: any[];
  nextRecordsUrl?: string;
}

interface SalesforceOpportunity {
  Id: string;
  StageName: string;
  Lead_ID__c: string | null;
  [key: string]: any;
}

interface SupabaseOpportunity {
  opportunity_id: string;
  lead_id: string;
  stage: string | null;
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

// Get all lead IDs from our database
async function getExistingLeadIds(): Promise<string[]> {
  console.log("Fetching existing lead IDs from database...");
  
  const { data, error } = await supabase
    .from('salesforce_leads')
    .select('lead_id');
  
  if (error) {
    console.error("Error fetching lead IDs:", error);
    throw new Error(`Failed to fetch lead IDs: ${error.message}`);
  }
  
  const leadIds = data.map(lead => lead.lead_id);
  console.log(`Found ${leadIds.length} existing lead IDs`);
  
  return leadIds;
}

// Query Salesforce for opportunities connected to our leads
async function fetchSalesforceOpportunities(token: string, instanceUrl: string, leadIds: string[]): Promise<SalesforceOpportunity[]> {
  console.log("Fetching Salesforce opportunities linked to our leads...");
  
  if (leadIds.length === 0) {
    console.log("No lead IDs to query opportunities for");
    return [];
  }
  
  // Prepare a comma-separated list of lead IDs enclosed in single quotes
  const leadIdList = leadIds.map(id => `'${id}'`).join(', ');
  
  const query = `
    SELECT Id, StageName, Lead_ID__c
    FROM Opportunity
    WHERE Lead_ID__c IN (${leadIdList})
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
  return data.records as SalesforceOpportunity[];
}

// Transform Salesforce opportunities to Supabase format
function transformOpportunities(salesforceOpportunities: SalesforceOpportunity[]): SupabaseOpportunity[] {
  console.log(`Transforming ${salesforceOpportunities.length} Salesforce opportunities...`);
  
  // Only keep opportunities that have a Lead ID
  const validOpportunities = salesforceOpportunities.filter(opp => opp.Lead_ID__c);
  
  return validOpportunities.map(opp => {
    return {
      opportunity_id: opp.Id,
      lead_id: opp.Lead_ID__c as string,
      stage: opp.StageName || null
    };
  });
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
    });
  
  if (error) {
    console.error("Supabase upsert error:", error);
    throw new Error(`Failed to sync opportunities to Supabase: ${error.message}`);
  }
  
  console.log(`Successfully synced ${opportunities.length} opportunities`);
  return opportunities.length;
}

// Main sync function
async function syncSalesforceOpportunities(): Promise<{ success: boolean; synced: number; error?: string }> {
  try {
    // Get existing lead IDs from our database
    const leadIds = await getExistingLeadIds();
    
    // Get Salesforce access token
    const authResponse = await getSalesforceToken();
    
    // Fetch opportunities for our leads
    const salesforceOpportunities = await fetchSalesforceOpportunities(
      authResponse.access_token, 
      authResponse.instance_url,
      leadIds
    );
    
    // Transform opportunities
    const transformedOpportunities = transformOpportunities(salesforceOpportunities);
    
    // Sync opportunities to Supabase
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
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
