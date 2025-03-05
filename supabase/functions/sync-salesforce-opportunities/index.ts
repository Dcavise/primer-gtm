
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

interface SupabaseLead {
  lead_id: string;
  converted_opportunity_id: string | null;
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

// Get leads with ConvertedOpportunityId from our database
async function getLeadsWithOpportunityIds(): Promise<SupabaseLead[]> {
  console.log("Fetching leads with converted opportunity IDs from database...");
  
  const { data, error } = await supabase
    .from('salesforce_leads')
    .select('lead_id, converted_opportunity_id')
    .not('converted_opportunity_id', 'is', null);
  
  if (error) {
    console.error("Error fetching leads with opportunity IDs:", error);
    throw new Error(`Failed to fetch leads with opportunity IDs: ${error.message}`);
  }
  
  console.log(`Found ${data.length} leads with opportunity IDs`);
  
  return data as SupabaseLead[];
}

// Get all lead IDs from our database as a fallback
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

// Fetch specific opportunities by ID
async function fetchOpportunitiesByIds(token: string, instanceUrl: string, opportunityIds: string[]): Promise<SalesforceOpportunity[]> {
  console.log("Fetching Salesforce opportunities by IDs...");
  
  if (opportunityIds.length === 0) {
    console.log("No opportunity IDs to query");
    return [];
  }
  
  // Prepare a comma-separated list of opportunity IDs enclosed in single quotes
  const idList = opportunityIds.map(id => `'${id}'`).join(', ');
  
  const query = `
    SELECT Id, StageName, Lead_ID__c
    FROM Opportunity
    WHERE Id IN (${idList})
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
  console.log(`Retrieved ${data.records.length} opportunities from Salesforce by IDs`);
  return data.records as SalesforceOpportunity[];
}

// Fallback: Query Salesforce for opportunities connected to our leads
async function fetchOpportunitiesByLeadIds(token: string, instanceUrl: string, leadIds: string[]): Promise<SalesforceOpportunity[]> {
  console.log("Fetching Salesforce opportunities linked to our leads (fallback)...");
  
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
  console.log(`Retrieved ${data.records.length} opportunities from Salesforce by lead IDs`);
  return data.records as SalesforceOpportunity[];
}

// Map opportunities to leads using converted opportunity IDs
function mapOpportunitiesToLeads(opportunities: SalesforceOpportunity[], leadsWithOpportunityIds: SupabaseLead[]): SupabaseOpportunity[] {
  console.log(`Mapping ${opportunities.length} opportunities to leads...`);
  
  // Create a map of opportunity ID to lead ID for quick lookup
  const opportunityToLeadMap = new Map<string, string>();
  
  leadsWithOpportunityIds.forEach(lead => {
    if (lead.converted_opportunity_id) {
      opportunityToLeadMap.set(lead.converted_opportunity_id, lead.lead_id);
    }
  });
  
  // Map the opportunities to leads
  const mappedOpportunities = opportunities
    .filter(opp => opportunityToLeadMap.has(opp.Id) || opp.Lead_ID__c)
    .map(opp => {
      const leadId = opportunityToLeadMap.get(opp.Id) || opp.Lead_ID__c!;
      
      return {
        opportunity_id: opp.Id,
        lead_id: leadId,
        stage: opp.StageName || null
      };
    })
    .filter(opp => opp.lead_id); // Ensure we have a valid lead_id
  
  console.log(`Mapped ${mappedOpportunities.length} opportunities to leads`);
  return mappedOpportunities;
}

// Upsert opportunities to Supabase
async function syncOpportunitiesToSupabase(opportunities: SupabaseOpportunity[]): Promise<number> {
  console.log(`Syncing ${opportunities.length} opportunities to Supabase...`);
  
  if (opportunities.length === 0) {
    console.log("No opportunities to sync");
    return 0;
  }
  
  const { error } = await supabase
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
    // Get Salesforce access token
    const authResponse = await getSalesforceToken();
    const token = authResponse.access_token;
    const instanceUrl = authResponse.instance_url;
    
    // Get leads with converted opportunity IDs
    const leadsWithOpportunityIds = await getLeadsWithOpportunityIds();
    
    // Extract opportunity IDs
    const opportunityIds = leadsWithOpportunityIds
      .filter(lead => lead.converted_opportunity_id)
      .map(lead => lead.converted_opportunity_id as string);
    
    console.log(`Found ${opportunityIds.length} opportunity IDs to fetch`);
    
    // Fetch opportunities by IDs
    let salesforceOpportunities: SalesforceOpportunity[] = [];
    if (opportunityIds.length > 0) {
      salesforceOpportunities = await fetchOpportunitiesByIds(token, instanceUrl, opportunityIds);
    }
    
    // If we didn't get many opportunities, try the fallback method
    if (salesforceOpportunities.length < opportunityIds.length / 2) {
      console.log("Retrieved fewer opportunities than expected, trying fallback method...");
      
      // Get all lead IDs as fallback
      const leadIds = await getExistingLeadIds();
      
      // Fetch opportunities by lead IDs (fallback)
      const fallbackOpportunities = await fetchOpportunitiesByLeadIds(token, instanceUrl, leadIds);
      
      // Combine the results, avoiding duplicates
      const existingIds = new Set(salesforceOpportunities.map(opp => opp.Id));
      const uniqueFallbackOpps = fallbackOpportunities.filter(opp => !existingIds.has(opp.Id));
      
      salesforceOpportunities = [...salesforceOpportunities, ...uniqueFallbackOpps];
      console.log(`Combined total: ${salesforceOpportunities.length} opportunities`);
    }
    
    // Map opportunities to leads
    const mappedOpportunities = mapOpportunitiesToLeads(salesforceOpportunities, leadsWithOpportunityIds);
    
    // Sync opportunities to Supabase
    const syncedCount = await syncOpportunitiesToSupabase(mappedOpportunities);
    
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
