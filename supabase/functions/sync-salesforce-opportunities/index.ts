
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
  Name: string | null;
  AccountId: string | null;
  CloseDate: string | null;
  Actualized_Tuition__c: number | null;
  [key: string]: any;
}

interface SupabaseOpportunity {
  opportunity_id: string;
  lead_id: string;
  stage: string | null;
  opportunity_name: string | null;
  account_id: string | null;
  close_date: string | null;
  actualized_tuition: number | null;
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

// Get all lead IDs from our database - including those that are already converted
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

// Get leads with converted opportunity IDs
async function getConvertedOpportunityIds(): Promise<Record<string, string>> {
  console.log("Fetching leads with converted opportunity IDs...");
  
  const { data, error } = await supabase
    .from('salesforce_leads')
    .select('lead_id, converted_opportunity_id')
    .not('converted_opportunity_id', 'is', null);
  
  if (error) {
    console.error("Error fetching converted opportunity IDs:", error);
    throw new Error(`Failed to fetch converted opportunity IDs: ${error.message}`);
  }
  
  // Create a mapping of converted opportunity ID to lead ID
  const opportunityToLeadMap: Record<string, string> = {};
  data.forEach(item => {
    if (item.converted_opportunity_id) {
      opportunityToLeadMap[item.converted_opportunity_id] = item.lead_id;
    }
  });
  
  console.log(`Found ${Object.keys(opportunityToLeadMap).length} leads with converted opportunity IDs`);
  
  return opportunityToLeadMap;
}

// Query Salesforce for opportunities from Lead_ID__c field AND ConvertedOpportunityId
async function fetchSalesforceOpportunities(token: string, instanceUrl: string, leadIds: string[], convertedOpportunityIds: string[]): Promise<SalesforceOpportunity[]> {
  console.log("Fetching Salesforce opportunities linked to our leads...");
  
  if (leadIds.length === 0 && convertedOpportunityIds.length === 0) {
    console.log("No lead IDs or opportunity IDs to query opportunities for");
    return [];
  }
  
  let query = `
    SELECT Id, StageName, Lead_ID__c, Name, AccountId, CloseDate, Actualized_Tuition__c
    FROM Opportunity
    WHERE 
  `;
  
  // Add conditions for Lead_ID__c field if we have lead IDs
  if (leadIds.length > 0) {
    // Prepare a comma-separated list of lead IDs enclosed in single quotes
    const leadIdList = leadIds.map(id => `'${id}'`).join(', ');
    query += `Lead_ID__c IN (${leadIdList})`;
  }
  
  // Add conditions for opportunity IDs from converted leads
  if (convertedOpportunityIds.length > 0) {
    if (leadIds.length > 0) {
      query += ` OR `;
    }
    // Prepare a comma-separated list of opportunity IDs enclosed in single quotes
    const opportunityIdList = convertedOpportunityIds.map(id => `'${id}'`).join(', ');
    query += `Id IN (${opportunityIdList})`;
  }
  
  query += `
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
function transformOpportunities(
  salesforceOpportunities: SalesforceOpportunity[], 
  opportunityToLeadMap: Record<string, string>
): SupabaseOpportunity[] {
  console.log(`Transforming ${salesforceOpportunities.length} Salesforce opportunities...`);
  
  return salesforceOpportunities.map(opp => {
    // First try to get the lead ID from the map (for converted opportunities)
    // If not found, fallback to Lead_ID__c field
    const leadId = opportunityToLeadMap[opp.Id] || opp.Lead_ID__c;
    
    // Format close date if available
    const closeDate = opp.CloseDate ? opp.CloseDate : null;
    
    return {
      opportunity_id: opp.Id,
      lead_id: leadId as string,
      stage: opp.StageName || null,
      opportunity_name: opp.Name || null,
      account_id: opp.AccountId || null,
      close_date: closeDate,
      actualized_tuition: opp.Actualized_Tuition__c || null
    };
  }).filter(opp => opp.lead_id); // Only keep opportunities that have a lead ID
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
async function syncSalesforceOpportunities(): Promise<{ success: boolean; synced: number; error?: string }> {
  try {
    // Get existing lead IDs from our database
    const leadIds = await getExistingLeadIds();
    
    // Get mapping of converted opportunity IDs to lead IDs
    const opportunityToLeadMap = await getConvertedOpportunityIds();
    
    // Get Salesforce access token
    const authResponse = await getSalesforceToken();
    
    // Fetch opportunities for our leads (both via Lead_ID__c and ConvertedOpportunityId)
    const salesforceOpportunities = await fetchSalesforceOpportunities(
      authResponse.access_token, 
      authResponse.instance_url,
      leadIds,
      Object.keys(opportunityToLeadMap)
    );
    
    // Transform opportunities
    const transformedOpportunities = transformOpportunities(
      salesforceOpportunities,
      opportunityToLeadMap
    );
    
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
