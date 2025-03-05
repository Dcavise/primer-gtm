
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
  StageName: string | null;
  CloseDate: string | null;
  Preferred_Campus__c: string | null;
  [key: string]: any;
}

interface SupabaseOpportunity {
  opportunity_id: string;
  opportunity_name: string | null;
  stage: string | null;
  close_date: string | null;
  preferred_campus: string | null;
  campus_id: string | null;
}

interface Campus {
  campus_id: string;
  campus_name: string;
}

// Get all campuses from the campuses table
async function getAllCampuses(): Promise<Campus[]> {
  console.log("Fetching all campuses from database...");
  
  const { data, error } = await supabase
    .from('campuses')
    .select('campus_id, campus_name');
  
  if (error) {
    console.error("Error fetching campuses:", error);
    throw new Error(`Failed to fetch campuses: ${error.message}`);
  }
  
  console.log(`Found ${data.length} campuses`);
  return data;
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
    SELECT Id, Name, StageName, CloseDate, Preferred_Campus__c
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

// Find campus_id for a given preferred_campus value
function findCampusId(preferredCampus: string | null, campuses: Campus[]): string | null {
  if (!preferredCampus) return null;
  
  // Convert to lowercase for case-insensitive matching
  const preferredCampusLower = preferredCampus.toLowerCase();
  
  // Find a perfect match first
  let matchingCampus = campuses.find(campus => 
    campus.campus_name.toLowerCase() === preferredCampusLower
  );
  
  // If no perfect match, try to find a partial match
  if (!matchingCampus) {
    matchingCampus = campuses.find(campus => {
      const campusNameLower = campus.campus_name.toLowerCase();
      return (
        campusNameLower.includes(preferredCampusLower) || 
        preferredCampusLower.includes(campusNameLower)
      );
    });
  }
  
  return matchingCampus ? matchingCampus.campus_id : null;
}

// Transform Salesforce opportunities to Supabase format
function transformOpportunities(salesforceOpportunities: SalesforceOpportunity[], campuses: Campus[]): SupabaseOpportunity[] {
  console.log(`Transforming ${salesforceOpportunities.length} Salesforce opportunities...`);
  
  return salesforceOpportunities.map(opportunity => {
    const preferredCampus = opportunity.Preferred_Campus__c;
    const campusId = findCampusId(preferredCampus, campuses);
    
    if (campusId) {
      console.log(`Matched opportunity ${opportunity.Id} (${preferredCampus}) with campus ID ${campusId}`);
    } else if (preferredCampus) {
      console.log(`No campus match found for opportunity ${opportunity.Id} (${preferredCampus})`);
    }
    
    return {
      opportunity_id: opportunity.Id,
      opportunity_name: opportunity.Name,
      stage: opportunity.StageName,
      close_date: opportunity.CloseDate,
      preferred_campus: opportunity.Preferred_Campus__c,
      campus_id: campusId
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
    const campuses = await getAllCampuses();
    
    if (campuses.length === 0) {
      return { success: true, synced: 0, error: "No campuses found. Import campuses first." };
    }
    
    const campusNames = campuses.map(campus => campus.campus_name);
    
    const authResponse = await getSalesforceToken();
    
    const salesforceOpportunities = await fetchSalesforceOpportunities(
      authResponse.access_token, 
      authResponse.instance_url,
      campusNames
    );
    
    if (salesforceOpportunities.length === 0) {
      return { success: true, synced: 0 };
    }
    
    const transformedOpportunities = transformOpportunities(salesforceOpportunities, campuses);
    
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
