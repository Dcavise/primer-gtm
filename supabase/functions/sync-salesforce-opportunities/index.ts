
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
  Name: string | null;
  AccountId: string | null;
  StageName: string | null;
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

interface Campus {
  campus_id: string;
  campus_name: string;
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

// Query Salesforce for all opportunities with preferred campus
async function fetchSalesforceOpportunities(token: string, instanceUrl: string, campusNames: string[]): Promise<SalesforceOpportunity[]> {
  console.log("Fetching Salesforce opportunities with matching preferred campus...");
  
  // Build a list of campus names enclosed in single quotes and join with commas for the IN clause
  const campusNamesList = campusNames.map(name => `'${name}'`).join(', ');
  
  const query = `
    SELECT Id, Name, AccountId, StageName, CloseDate, Preferred_Campus__c
    FROM Opportunity
    WHERE Preferred_Campus__c IN (${campusNamesList})
    ORDER BY CloseDate DESC
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

// Transform Salesforce opportunities to Supabase format
function transformOpportunities(salesforceOpportunities: SalesforceOpportunity[]): SupabaseOpportunity[] {
  console.log(`Transforming ${salesforceOpportunities.length} Salesforce opportunities...`);
  
  return salesforceOpportunities.map(opportunity => {
    return {
      opportunity_id: opportunity.Id,
      opportunity_name: opportunity.Name,
      account_id: opportunity.AccountId,
      stage: opportunity.StageName,
      close_date: opportunity.CloseDate,
      preferred_campus: opportunity.Preferred_Campus__c,
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
    const campusNames = await getCampusNames();
    
    if (campusNames.length === 0) {
      return { success: true, synced: 0, error: "No campuses found. Import campuses first." };
    }
    
    const authResponse = await getSalesforceToken();
    
    const salesforceOpportunities = await fetchSalesforceOpportunities(
      authResponse.access_token, 
      authResponse.instance_url,
      campusNames
    );
    
    if (salesforceOpportunities.length === 0) {
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
