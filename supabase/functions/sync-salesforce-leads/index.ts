
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
  Preferred_Campus__c: string | null;
  ConvertedAccountId: string | null;
  ConvertedContactId: string | null;
  ConvertedOpportunityId: string | null;
  [key: string]: any;
}

interface SupabaseLead {
  lead_id: string;
  first_name: string | null;
  last_name: string;
  created_date: string | null;
  converted_date: string | null;
  converted: boolean | null;
  is_converted: boolean | null;
  stage: string | null;
  lead_source: string | null;
  preferred_campus: string | null;
  campus_id: string | null;
  converted_opportunity_id: string | null;
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

// Query Salesforce for all leads with extended fields
async function fetchSalesforceLeads(token: string, instanceUrl: string): Promise<SalesforceLead[]> {
  console.log("Fetching all Salesforce leads with conversion data...");
  
  const query = `
    SELECT Id, FirstName, LastName, CreatedDate, ConvertedDate, IsConverted, 
           Status, LeadSource, Company, Preferred_Campus__c,
           ConvertedAccountId, ConvertedContactId, ConvertedOpportunityId
    FROM Lead
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
    throw new Error(`Failed to fetch Salesforce leads: ${response.status} ${errorText}`);
  }

  const data: SalesforceQueryResponse = await response.json();
  console.log(`Retrieved ${data.records.length} leads from Salesforce`);
  return data.records;
}

// Find the campus_id for a given preferred_campus value
function findCampusId(preferredCampus: string | null, campuses: Campus[]): string | null {
  if (!preferredCampus) return null;
  
  // Normalize campus name: lowercase and trim
  const preferredCampusNormalized = preferredCampus.toLowerCase().trim();
  
  // Log the matching attempt for debugging
  console.log(`Finding campus ID for "${preferredCampus}" (normalized: "${preferredCampusNormalized}")`);
  
  // Find a perfect match first (case-insensitive)
  let matchingCampus = campuses.find(campus => 
    campus.campus_name.toLowerCase().trim() === preferredCampusNormalized ||
    campus.campus_id.toLowerCase().trim() === preferredCampusNormalized
  );
  
  // If no perfect match, try to find a partial match
  if (!matchingCampus) {
    matchingCampus = campuses.find(campus => {
      const campusNameLower = campus.campus_name.toLowerCase().trim();
      const campusIdLower = campus.campus_id.toLowerCase().trim();
      return (
        campusNameLower.includes(preferredCampusNormalized) || 
        preferredCampusNormalized.includes(campusNameLower) ||
        campusIdLower.includes(preferredCampusNormalized) ||
        preferredCampusNormalized.includes(campusIdLower)
      );
    });
  }
  
  // If still no match, try to match against a normalized version of the campus_id
  if (!matchingCampus) {
    // Convert preferredCampus to a format similar to campus_id (lowercase, dashed)
    const normalizedPreferredCampus = preferredCampusNormalized.replace(/\s+/g, '-');
    
    matchingCampus = campuses.find(campus => {
      const campusIdLower = campus.campus_id.toLowerCase();
      return campusIdLower === normalizedPreferredCampus ||
             campusIdLower === preferredCampusNormalized;
    });
  }
  
  if (matchingCampus) {
    console.log(`Match found: "${preferredCampus}" → campus_id "${matchingCampus.campus_id}" (${matchingCampus.campus_name})`);
    // Always return campus_id in its original case from the campuses table
    return matchingCampus.campus_id;
  } else {
    console.log(`NO MATCH for "${preferredCampus}"`);
    return null;
  }
}

// Transform Salesforce leads to Supabase format
function transformLeads(salesforceLeads: SalesforceLead[], campuses: Campus[]): SupabaseLead[] {
  console.log(`Transforming ${salesforceLeads.length} Salesforce leads...`);
  
  return salesforceLeads.map(lead => {
    const createdDate = lead.CreatedDate ? new Date(lead.CreatedDate).toISOString().split('T')[0] : null;
    const convertedDate = lead.ConvertedDate ? new Date(lead.ConvertedDate).toISOString().split('T')[0] : null;
    
    const stage = lead.Status || null;
    const preferredCampus = lead.Preferred_Campus__c || null;
    const campusId = findCampusId(preferredCampus, campuses);
    
    if (campusId && preferredCampus) {
      console.log(`Matched lead ${lead.Id} (${preferredCampus}) with campus ID ${campusId}`);
    } else if (preferredCampus) {
      console.log(`No campus match found for lead ${lead.Id} (${preferredCampus})`);
    }
    
    return {
      lead_id: lead.Id,
      first_name: lead.FirstName || null,
      last_name: lead.LastName,
      created_date: createdDate,
      converted_date: convertedDate,
      converted: lead.IsConverted,
      is_converted: lead.IsConverted,
      stage: stage,
      lead_source: lead.LeadSource,
      preferred_campus: preferredCampus,
      campus_id: campusId,
      converted_opportunity_id: lead.ConvertedOpportunityId
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
      ignoreDuplicates: false,
      returning: 'minimal'
    })
    .select();
  
  if (error) {
    console.error("Supabase upsert error:", error);
    throw new Error(`Failed to sync leads to Supabase: ${error.message}`);
  }
  
  console.log(`Successfully synced ${data?.length || 0} leads`);
  return data?.length || 0;
}

// Clear preferred_campus values for leads that have wrong data (company name)
async function clearIncorrectPreferredCampus(campuses: Campus[]): Promise<number> {
  console.log("Checking for leads with Company data in preferred_campus field...");
  
  if (!campuses || campuses.length === 0) {
    console.log("No campuses found, skipping cleaning");
    return 0;
  }
  
  // Get all leads that have a preferred_campus value
  const { data: leads, error: leadsError } = await supabase
    .from('salesforce_leads')
    .select('*')
    .not('preferred_campus', 'is', null);
  
  if (leadsError) {
    console.error("Error fetching leads:", leadsError);
    throw new Error(`Failed to fetch leads: ${leadsError.message}`);
  }
  
  if (!leads || leads.length === 0) {
    console.log("No leads with preferred_campus values found");
    return 0;
  }
  
  let cleanedCount = 0;
  const campusNames = campuses.map(c => c.campus_name.toLowerCase());
  
  // For each lead with a preferred_campus value, check if it doesn't match any known campus name pattern
  for (const lead of leads) {
    if (!lead.preferred_campus) continue;
    
    const preferredCampusLower = lead.preferred_campus.toLowerCase();
    
    // Check if this preferred_campus value could be a campus name
    const mightBeCampus = campusNames.some(campusName => 
      preferredCampusLower.includes(campusName) || 
      campusName.includes(preferredCampusLower)
    );
    
    // If no similarity to any campus name and it's likely from the old Company field,
    // clear the preferred_campus field
    if (!mightBeCampus) {
      console.log(`Clearing likely company data from lead ${lead.id} (${lead.preferred_campus})`);
      
      const { error: updateError } = await supabase
        .from('salesforce_leads')
        .update({ preferred_campus: null })
        .eq('id', lead.id);
      
      if (updateError) {
        console.error(`Error updating lead ${lead.id}:`, updateError);
      } else {
        cleanedCount++;
      }
    }
  }
  
  console.log(`Cleaned ${cleanedCount} leads with likely company data`);
  return cleanedCount;
}

// Fix existing leads with inconsistent campus IDs
async function fixExistingLeads(campuses: Campus[]): Promise<number> {
  console.log("Checking for leads with mismatched campus IDs...");
  
  // Get all leads that have a preferred_campus value
  const { data: leads, error: leadsError } = await supabase
    .from('salesforce_leads')
    .select('id, lead_id, preferred_campus, campus_id')
    .not('preferred_campus', 'is', null);
  
  if (leadsError) {
    console.error("Error fetching leads:", leadsError);
    throw new Error(`Failed to fetch leads: ${leadsError.message}`);
  }
  
  if (!leads || leads.length === 0) {
    console.log("No leads with preferred_campus values found");
    return 0;
  }
  
  console.log(`Found ${leads.length} leads with preferred_campus values`);
  let updatedCount = 0;
  
  // Process each lead and update if needed
  for (const lead of leads) {
    if (!lead.preferred_campus) continue;
    
    // Find the correct campus_id using our enhanced matching function
    const matchedCampusId = findCampusId(lead.preferred_campus, campuses);
    
    // If we found a match and it's different from the current value, update it
    if (matchedCampusId && matchedCampusId !== lead.campus_id) {
      console.log(`Updating lead ${lead.lead_id}: changing campus_id from "${lead.campus_id}" to "${matchedCampusId}"`);
      
      const { error: updateError } = await supabase
        .from('salesforce_leads')
        .update({ campus_id: matchedCampusId })
        .eq('id', lead.id);
      
      if (updateError) {
        console.error(`Error updating lead ${lead.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }
  
  console.log(`Updated campus_id for ${updatedCount} leads`);
  return updatedCount;
}

// Fix campus IDs in the opportunities table
async function fixOpportunitiesCampusIds(campuses: Campus[]): Promise<number> {
  console.log("Checking for opportunities with mismatched campus IDs...");
  
  // Get all opportunities with preferred_campus value
  const { data: opportunities, error: oppsError } = await supabase
    .from('salesforce_opportunities')
    .select('id, opportunity_id, preferred_campus, campus_id');
  
  if (oppsError) {
    console.error("Error fetching opportunities:", oppsError);
    throw new Error(`Failed to fetch opportunities: ${oppsError.message}`);
  }
  
  if (!opportunities || opportunities.length === 0) {
    console.log("No opportunities found");
    return 0;
  }
  
  console.log(`Found ${opportunities.length} opportunities to check`);
  let updatedCount = 0;
  
  // Process each opportunity with preferred_campus and fix campus_id
  for (const opp of opportunities) {
    // Skip if no preferred_campus to match against
    if (!opp.preferred_campus) continue;
    
    // Find the correct campus_id using our enhanced matching function
    const matchedCampusId = findCampusId(opp.preferred_campus, campuses);
    
    // If we found a match and it's different from the current value, update it
    if (matchedCampusId && matchedCampusId !== opp.campus_id) {
      console.log(`Updating opportunity ${opp.opportunity_id}: changing campus_id from "${opp.campus_id}" to "${matchedCampusId}"`);
      
      const { error: updateError } = await supabase
        .from('salesforce_opportunities')
        .update({ campus_id: matchedCampusId })
        .eq('id', opp.id);
      
      if (updateError) {
        console.error(`Error updating opportunity ${opp.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
    
    // If no campus_id but we found a match, update it
    if (matchedCampusId && !opp.campus_id) {
      console.log(`Setting campus_id for opportunity ${opp.opportunity_id} to "${matchedCampusId}"`);
      
      const { error: updateError } = await supabase
        .from('salesforce_opportunities')
        .update({ campus_id: matchedCampusId })
        .eq('id', opp.id);
      
      if (updateError) {
        console.error(`Error updating opportunity ${opp.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }
  
  console.log(`Updated campus_id for ${updatedCount} opportunities`);
  return updatedCount;
}

// Fix campus IDs in the fellows table
async function fixFellowsCampusIds(campuses: Campus[]): Promise<number> {
  console.log("Checking for fellows with mismatched campus IDs...");
  
  // Get all fellows with campus value
  const { data: fellows, error: fellowsError } = await supabase
    .from('fellows')
    .select('id, fellow_id, campus, campus_id');
  
  if (fellowsError) {
    console.error("Error fetching fellows:", fellowsError);
    throw new Error(`Failed to fetch fellows: ${fellowsError.message}`);
  }
  
  if (!fellows || fellows.length === 0) {
    console.log("No fellows found");
    return 0;
  }
  
  console.log(`Found ${fellows.length} fellows to check`);
  let updatedCount = 0;
  
  // Process each fellow with campus name and fix campus_id
  for (const fellow of fellows) {
    // Skip if no campus to match against
    if (!fellow.campus) continue;
    
    // Find the correct campus_id using our enhanced matching function
    const matchedCampusId = findCampusId(fellow.campus, campuses);
    
    // If we found a match and it's different from the current value, update it
    if (matchedCampusId && matchedCampusId !== fellow.campus_id) {
      console.log(`Updating fellow ${fellow.fellow_id}: changing campus_id from "${fellow.campus_id}" to "${matchedCampusId}"`);
      
      const { error: updateError } = await supabase
        .from('fellows')
        .update({ campus_id: matchedCampusId })
        .eq('id', fellow.id);
      
      if (updateError) {
        console.error(`Error updating fellow ${fellow.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
    
    // If no campus_id but we found a match, update it
    if (matchedCampusId && !fellow.campus_id) {
      console.log(`Setting campus_id for fellow ${fellow.fellow_id} to "${matchedCampusId}"`);
      
      const { error: updateError } = await supabase
        .from('fellows')
        .update({ campus_id: matchedCampusId })
        .eq('id', fellow.id);
      
      if (updateError) {
        console.error(`Error updating fellow ${fellow.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }
  
  console.log(`Updated campus_id for ${updatedCount} fellows`);
  return updatedCount;
}

// Main sync function
async function syncSalesforceLeads(): Promise<{ 
  success: boolean; 
  synced: number; 
  matched?: number; 
  cleaned?: number; 
  fixed?: number;
  fixedOpportunities?: number;
  fixedFellows?: number;
  accounts?: number;
  contacts?: number;
  error?: string 
}> {
  try {
    const campuses = await getAllCampuses();
    
    // Fix existing leads with inconsistent campus IDs
    const fixedCount = await fixExistingLeads(campuses);
    
    // Fix campus IDs in opportunities and fellows tables
    const fixedOpportunitiesCount = await fixOpportunitiesCampusIds(campuses);
    const fixedFellowsCount = await fixFellowsCampusIds(campuses);
    
    const authResponse = await getSalesforceToken();
    
    const salesforceLeads = await fetchSalesforceLeads(
      authResponse.access_token, 
      authResponse.instance_url
    );
    
    const transformedLeads = transformLeads(salesforceLeads, campuses);
    
    const syncedCount = await syncLeadsToSupabase(transformedLeads);
    
    // Clean up incorrect preferred_campus values
    const cleanedCount = await clearIncorrectPreferredCampus(campuses);
    
    // For backwards compatibility: Count how many leads were matched with campuses
    const { data: matchedLeads, error: matchedError } = await supabase
      .from('salesforce_leads')
      .select('id')
      .not('campus_id', 'is', null);
    
    const matchedCount = matchedError ? 0 : (matchedLeads?.length || 0);
    
    return { 
      success: true, 
      synced: syncedCount,
      matched: matchedCount,
      cleaned: cleanedCount,
      fixed: fixedCount,
      fixedOpportunities: fixedOpportunitiesCount,
      fixedFellows: fixedFellowsCount
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
