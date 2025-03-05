
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

// Define batch size for ID processing to avoid URI Too Long errors
const BATCH_SIZE = 100;

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
  Name: string | null;
  AccountId: string | null;
  CloseDate: string | null;
  Preferred_Campus__c: string | null;
  [key: string]: any;
}

interface SupabaseOpportunity {
  opportunity_id: string;
  opportunity_name: string | null;
  account_id: string | null;
  stage: string | null;
  close_date: string | null;
  preferred_campus: string | null;
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

// Get all campus names from the campuses table
async function getCampusNames(): Promise<string[]> {
  console.log("Fetching campus names from database...");
  
  const { data, error } = await supabase
    .from('campuses')
    .select('campus_name');
  
  if (error) {
    console.error("Error fetching campus names:", error);
    throw new Error(`Failed to fetch campus names: ${error.message}`);
  }
  
  const campusNames = data.map(campus => campus.campus_name);
  console.log(`Found ${campusNames.length} campuses:`, campusNames);
  
  return campusNames;
}

// Query Salesforce for opportunities with Preferred_Campus__c field
async function fetchSalesforceOpportunities(
  token: string, 
  instanceUrl: string,
  campusNames: string[]
): Promise<SalesforceOpportunity[]> {
  console.log("Fetching Salesforce opportunities with preferred campus...");
  
  if (campusNames.length === 0) {
    console.log("No campus names to query opportunities for");
    return [];
  }
  
  // Create a SOQL query with a filter for Preferred_Campus__c IS NOT NULL
  const query = `
    SELECT Id, StageName, Name, AccountId, CloseDate, Preferred_Campus__c
    FROM Opportunity
    WHERE Preferred_Campus__c != null
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

// Filter opportunities by campus name match
function filterOpportunitiesByCampus(
  opportunities: SalesforceOpportunity[],
  campusNames: string[]
): SalesforceOpportunity[] {
  console.log(`Filtering ${opportunities.length} opportunities to match campus names...`);
  
  // Create lowercase versions of campus names for case-insensitive matching
  const lowercaseCampusNames = campusNames.map(name => name.toLowerCase());
  
  const filteredOpportunities = opportunities.filter(opp => {
    if (!opp.Preferred_Campus__c) return false;
    
    const preferredCampusLower = opp.Preferred_Campus__c.toLowerCase();
    
    // Check if any campus name is contained within the preferred_campus field
    // or the preferred_campus is contained within any campus name
    return lowercaseCampusNames.some(campusName => 
      preferredCampusLower.includes(campusName) || 
      campusName.includes(preferredCampusLower)
    );
  });
  
  console.log(`Filtered to ${filteredOpportunities.length} opportunities matching campus names`);
  return filteredOpportunities;
}

// Transform Salesforce opportunities to Supabase format
function transformOpportunities(salesforceOpportunities: SalesforceOpportunity[]): SupabaseOpportunity[] {
  console.log(`Transforming ${salesforceOpportunities.length} Salesforce opportunities...`);
  
  return salesforceOpportunities.map(opp => {
    // Format close date if available
    const closeDate = opp.CloseDate ? opp.CloseDate : null;
    
    return {
      opportunity_id: opp.Id,
      opportunity_name: opp.Name || null,
      account_id: opp.AccountId || null,
      stage: opp.StageName || null,
      close_date: closeDate,
      preferred_campus: opp.Preferred_Campus__c || null
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
  
  // Process in batches to avoid request size limits
  const UPSERT_BATCH_SIZE = 500;
  const batches = chunkArray(opportunities, UPSERT_BATCH_SIZE);
  let totalSynced = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing upsert batch ${i+1}/${batches.length} with ${batch.length} records`);
    
    const { data, error } = await supabase
      .from('salesforce_opportunities')
      .upsert(batch, { 
        onConflict: 'opportunity_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error("Supabase upsert error:", error);
      throw new Error(`Failed to sync opportunities to Supabase: ${error.message}`);
    }
    
    totalSynced += batch.length;
  }
  
  console.log(`Successfully synced ${totalSynced} opportunities`);
  return totalSynced;
}

// Split array into chunks of specified size
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Main sync function
async function syncSalesforceOpportunities(): Promise<{ success: boolean; synced: number; error?: string }> {
  try {
    // Get campus names to filter opportunities
    const campusNames = await getCampusNames();
    
    // Get Salesforce access token
    const authResponse = await getSalesforceToken();
    
    // Fetch opportunities from Salesforce
    const salesforceOpportunities = await fetchSalesforceOpportunities(
      authResponse.access_token, 
      authResponse.instance_url,
      campusNames
    );
    
    // Filter opportunities to only include those with matching campus names
    const filteredOpportunities = filterOpportunitiesByCampus(
      salesforceOpportunities,
      campusNames
    );
    
    // Transform opportunities
    const transformedOpportunities = transformOpportunities(filteredOpportunities);
    
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
