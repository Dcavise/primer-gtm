
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
  // Removed Lead_ID__c since it doesn't exist
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

// Retrieve opportunities created from leads
async function fetchOpportunitiesFromLeads(token: string, instanceUrl: string, leadIds: string[]): Promise<SalesforceOpportunity[]> {
  console.log(`Fetching opportunities for ${leadIds.length} lead IDs in batches...`);
  
  // Process in batches of 100 to avoid URI too long errors
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < leadIds.length; i += batchSize) {
    batches.push(leadIds.slice(i, i + batchSize));
  }
  
  console.log(`Split into ${batches.length} batches`);
  
  let allOpportunities: SalesforceOpportunity[] = [];
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i+1}/${batches.length} with ${batch.length} lead IDs`);
    
    // Get converted leads first to identify their associated opportunities
    const leadIdList = batch.map(id => `'${id}'`).join(', ');
    
    const leadQuery = `
      SELECT Id, ConvertedOpportunityId
      FROM Lead
      WHERE Id IN (${leadIdList})
      AND ConvertedOpportunityId != null
      LIMIT 2000
    `;
    
    console.log(`SOQL Query for leads batch ${i+1}:`, leadQuery.substring(0, 100) + "...");
    
    try {
      const encodedLeadQuery = encodeURIComponent(leadQuery);
      const leadQueryUrl = `${instanceUrl}/services/data/v58.0/query?q=${encodedLeadQuery}`;
      
      const leadResponse = await fetch(leadQueryUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!leadResponse.ok) {
        const errorText = await leadResponse.text();
        console.error(`Salesforce lead query error for batch ${i+1}:`, errorText);
        throw new Error(`Failed to fetch Salesforce leads: ${leadResponse.status} ${errorText}`);
      }
  
      const leadData = await leadResponse.json();
      
      if (leadData.records.length === 0) {
        console.log(`No converted leads found in batch ${i+1}`);
        continue;
      }
      
      console.log(`Found ${leadData.records.length} converted leads with opportunities`);
      
      // Get opportunity IDs from converted leads
      const opportunityIds = leadData.records
        .filter(lead => lead.ConvertedOpportunityId)
        .map(lead => `'${lead.ConvertedOpportunityId}'`);
      
      if (opportunityIds.length === 0) {
        console.log(`No opportunity IDs found in batch ${i+1}`);
        continue;
      }
      
      const opportunityIdList = opportunityIds.join(', ');
      
      // Now get the opportunities
      const opportunityQuery = `
        SELECT Id, Name, StageName, CloseDate, AccountId
        FROM Opportunity
        WHERE Id IN (${opportunityIdList})
        LIMIT 2000
      `;
      
      console.log(`SOQL Query for opportunities batch ${i+1}:`, opportunityQuery.substring(0, 100) + "...");
      
      const encodedOpportunityQuery = encodeURIComponent(opportunityQuery);
      const opportunityQueryUrl = `${instanceUrl}/services/data/v58.0/query?q=${encodedOpportunityQuery}`;
      
      const opportunityResponse = await fetch(opportunityQueryUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!opportunityResponse.ok) {
        const errorText = await opportunityResponse.text();
        console.error(`Salesforce opportunity query error for batch ${i+1}:`, errorText);
        throw new Error(`Failed to fetch Salesforce opportunities: ${opportunityResponse.status} ${errorText}`);
      }
  
      const opportunityData = await opportunityResponse.json();
      console.log(`Retrieved ${opportunityData.records.length} opportunities from batch ${i+1}`);
      
      // Map lead IDs to opportunity IDs
      const leadToOpportunityMap = new Map();
      leadData.records.forEach(lead => {
        if (lead.ConvertedOpportunityId) {
          leadToOpportunityMap.set(lead.ConvertedOpportunityId, lead.Id);
        }
      });
      
      // Add lead ID to each opportunity
      const opportunitiesWithLeads = opportunityData.records.map(opp => {
        return {
          ...opp,
          LeadId: leadToOpportunityMap.get(opp.Id)
        };
      });
      
      allOpportunities = [...allOpportunities, ...opportunitiesWithLeads];
    } catch (error) {
      console.error(`Error in batch ${i+1}:`, error);
      throw error;
    }
  }
  
  console.log(`Total opportunities found: ${allOpportunities.length}`);
  return allOpportunities;
}

// Transform Salesforce opportunities to Supabase format
function transformOpportunities(salesforceOpportunities: SalesforceOpportunity[]): SupabaseOpportunity[] {
  console.log(`Transforming ${salesforceOpportunities.length} Salesforce opportunities...`);
  
  return salesforceOpportunities.map(opp => {
    return {
      opportunity_id: opp.Id,
      opportunity_name: opp.Name || null,
      stage: opp.StageName || null,
      close_date: opp.CloseDate || null,
      account_id: opp.AccountId || null,
      lead_id: opp.LeadId // Using the LeadId we added in fetchOpportunitiesFromLeads
    };
  });
}

// Upsert opportunities to Supabase
async function syncOpportunitiesToSupabase(opportunities: SupabaseOpportunity[]): Promise<number> {
  console.log(`Syncing ${opportunities.length} opportunities to Supabase...`);
  
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
    // Get all lead IDs from salesforce_leads
    console.log("Fetching all lead IDs from salesforce_leads...");
    const { data: leads, error: leadsError } = await supabase
      .from('salesforce_leads')
      .select('lead_id')
      .not('lead_id', 'is', null);
    
    if (leadsError) {
      console.error("Error fetching lead IDs:", leadsError);
      throw new Error(`Failed to fetch lead IDs: ${leadsError.message}`);
    }
    
    if (!leads || leads.length === 0) {
      console.log("No leads found, nothing to sync");
      return { success: true, synced: 0 };
    }
    
    const leadIds = leads.map(l => l.lead_id);
    console.log(`Found ${leadIds.length} lead IDs to check for opportunities`);
    
    const authResponse = await getSalesforceToken();
    
    const salesforceOpportunities = await fetchOpportunitiesFromLeads(
      authResponse.access_token, 
      authResponse.instance_url,
      leadIds
    );
    
    if (salesforceOpportunities.length === 0) {
      console.log("No opportunities found for these leads");
      return { success: true, synced: 0 };
    }
    
    const transformedOpportunities = transformOpportunities(salesforceOpportunities);
    
    const syncedCount = await syncOpportunitiesToSupabase(transformedOpportunities);
    
    return { success: true, synced: syncedCount };
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
