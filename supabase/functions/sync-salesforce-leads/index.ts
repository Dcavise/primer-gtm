
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
  converted_account_id: string | null;
  converted_contact_id: string | null;
  converted_opportunity_id: string | null;
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

// Transform Salesforce leads to Supabase format
function transformLeads(salesforceLeads: SalesforceLead[], campusNames: string[]): SupabaseLead[] {
  console.log(`Transforming ${salesforceLeads.length} Salesforce leads...`);
  
  return salesforceLeads.map(lead => {
    const createdDate = lead.CreatedDate ? new Date(lead.CreatedDate).toISOString().split('T')[0] : null;
    const convertedDate = lead.ConvertedDate ? new Date(lead.ConvertedDate).toISOString().split('T')[0] : null;
    
    const stage = lead.Status || null;
    let preferredCampus = lead.Preferred_Campus__c || null;
    
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
      campus_id: null, // This will be linked later in a separate function
      converted_account_id: lead.ConvertedAccountId,
      converted_contact_id: lead.ConvertedContactId,
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

// Match leads with campuses using fuzzy matching
async function matchLeadsWithCampuses(): Promise<number> {
  console.log("Matching leads with campuses using fuzzy matching...");
  
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
  
  // Get all leads that have a preferred_campus value but no campus_id assigned
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
  
  // For each lead, try to find a matching campus using fuzzy matching
  for (const lead of leads) {
    if (!lead.preferred_campus) continue;
    
    // Convert to lowercase for case-insensitive matching
    const preferredCampusLower = lead.preferred_campus.toLowerCase();
    
    // Find any campus where the name is contained within the preferred_campus field
    // or the preferred_campus is contained within the campus name
    const matchingCampus = campuses.find(campus => {
      const campusNameLower = campus.campus_name.toLowerCase();
      return (
        campusNameLower.includes(preferredCampusLower) || 
        preferredCampusLower.includes(campusNameLower)
      );
    });
    
    if (matchingCampus) {
      console.log(`Matched lead ${lead.id} (${lead.preferred_campus}) with campus ${matchingCampus.campus_name}`);
      
      const { error: updateError } = await supabase
        .from('salesforce_leads')
        .update({ campus_id: matchingCampus.campus_id })
        .eq('id', lead.id);
      
      if (updateError) {
        console.error(`Error updating lead ${lead.id}:`, updateError);
      } else {
        matchedCount++;
      }
    } else {
      console.log(`No campus match found for lead ${lead.id} (${lead.preferred_campus})`);
    }
  }
  
  console.log(`Matched ${matchedCount} leads with campuses`);
  return matchedCount;
}

// Clear preferred_campus values for leads that have wrong data (company name)
async function clearIncorrectPreferredCampus(): Promise<number> {
  console.log("Checking for leads with Company data in preferred_campus field...");
  
  // Get all campuses
  const { data: campuses, error: campusError } = await supabase
    .from('campuses')
    .select('campus_name');
  
  if (campusError) {
    console.error("Error fetching campuses:", campusError);
    throw new Error(`Failed to fetch campuses: ${campusError.message}`);
  }
  
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

// Fetch and sync account data
async function syncSalesforceAccounts(token: string, instanceUrl: string): Promise<number> {
  console.log("Fetching and syncing Salesforce accounts...");
  
  // Get all ConvertedAccountId values from leads
  const { data: leads, error: leadsError } = await supabase
    .from('salesforce_leads')
    .select('converted_account_id')
    .not('converted_account_id', 'is', null);
  
  if (leadsError) {
    console.error("Error fetching leads with account IDs:", leadsError);
    throw new Error(`Failed to fetch leads: ${leadsError.message}`);
  }
  
  if (!leads || leads.length === 0) {
    console.log("No leads with account IDs found");
    return 0;
  }
  
  // Extract unique account IDs
  const accountIds = [...new Set(leads.map(l => l.converted_account_id).filter(Boolean))];
  
  if (accountIds.length === 0) {
    console.log("No account IDs to sync");
    return 0;
  }
  
  console.log(`Found ${accountIds.length} unique account IDs to sync`);
  
  // Prepare a comma-separated list of account IDs enclosed in single quotes
  const accountIdList = accountIds.map(id => `'${id}'`).join(', ');
  
  const query = `
    SELECT Id, Name
    FROM Account
    WHERE Id IN (${accountIdList})
    LIMIT 1000
  `;
  
  console.log("SOQL Query for accounts:", query);
  
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
    console.error("Salesforce account query error:", errorText);
    throw new Error(`Failed to fetch Salesforce accounts: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log(`Retrieved ${data.records.length} accounts from Salesforce`);
  
  if (data.records.length === 0) {
    return 0;
  }
  
  // Transform and upsert account records
  const accounts = data.records.map(account => ({
    account_id: account.Id,
    account_name: account.Name
  }));
  
  const { data: syncedAccounts, error: syncError } = await supabase
    .from('salesforce_accounts')
    .upsert(accounts, {
      onConflict: 'account_id',
      ignoreDuplicates: false,
      returning: 'minimal'
    })
    .select();
  
  if (syncError) {
    console.error("Error syncing accounts:", syncError);
    throw new Error(`Failed to sync accounts: ${syncError.message}`);
  }
  
  return syncedAccounts?.length || 0;
}

// Fetch and sync contact data
async function syncSalesforceContacts(token: string, instanceUrl: string): Promise<number> {
  console.log("Fetching and syncing Salesforce contacts...");
  
  // Get all ConvertedContactId values from leads
  const { data: leads, error: leadsError } = await supabase
    .from('salesforce_leads')
    .select('converted_contact_id')
    .not('converted_contact_id', 'is', null);
  
  if (leadsError) {
    console.error("Error fetching leads with contact IDs:", leadsError);
    throw new Error(`Failed to fetch leads: ${leadsError.message}`);
  }
  
  if (!leads || leads.length === 0) {
    console.log("No leads with contact IDs found");
    return 0;
  }
  
  // Extract unique contact IDs
  const contactIds = [...new Set(leads.map(l => l.converted_contact_id).filter(Boolean))];
  
  if (contactIds.length === 0) {
    console.log("No contact IDs to sync");
    return 0;
  }
  
  console.log(`Found ${contactIds.length} unique contact IDs to sync`);
  
  // Prepare a comma-separated list of contact IDs enclosed in single quotes
  const contactIdList = contactIds.map(id => `'${id}'`).join(', ');
  
  const query = `
    SELECT Id, FirstName, LastName, Email, AccountId
    FROM Contact
    WHERE Id IN (${contactIdList})
    LIMIT 1000
  `;
  
  console.log("SOQL Query for contacts:", query);
  
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
    console.error("Salesforce contact query error:", errorText);
    throw new Error(`Failed to fetch Salesforce contacts: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log(`Retrieved ${data.records.length} contacts from Salesforce`);
  
  if (data.records.length === 0) {
    return 0;
  }
  
  // Transform and upsert contact records
  const contacts = data.records.map(contact => ({
    contact_id: contact.Id,
    first_name: contact.FirstName || null,
    last_name: contact.LastName,
    email: contact.Email || null,
    account_id: contact.AccountId || null
  }));
  
  const { data: syncedContacts, error: syncError } = await supabase
    .from('salesforce_contacts')
    .upsert(contacts, {
      onConflict: 'contact_id',
      ignoreDuplicates: false,
      returning: 'minimal'
    })
    .select();
  
  if (syncError) {
    console.error("Error syncing contacts:", syncError);
    throw new Error(`Failed to sync contacts: ${syncError.message}`);
  }
  
  return syncedContacts?.length || 0;
}

// Main sync function
async function syncSalesforceLeads(): Promise<{ 
  success: boolean; 
  synced: number; 
  matched?: number; 
  cleaned?: number; 
  accounts?: number;
  contacts?: number;
  error?: string 
}> {
  try {
    const campusNames = await getCampusNames();
    
    const authResponse = await getSalesforceToken();
    
    const salesforceLeads = await fetchSalesforceLeads(
      authResponse.access_token, 
      authResponse.instance_url
    );
    
    const transformedLeads = transformLeads(salesforceLeads, campusNames);
    
    const syncedCount = await syncLeadsToSupabase(transformedLeads);
    
    // Clean up incorrect preferred_campus values
    const cleanedCount = await clearIncorrectPreferredCampus();
    
    const matchedCount = await matchLeadsWithCampuses();
    
    // Sync related objects
    const accountsCount = await syncSalesforceAccounts(
      authResponse.access_token,
      authResponse.instance_url
    );
    
    const contactsCount = await syncSalesforceContacts(
      authResponse.access_token,
      authResponse.instance_url
    );
    
    return { 
      success: true, 
      synced: syncedCount,
      matched: matchedCount,
      cleaned: cleanedCount,
      accounts: accountsCount,
      contacts: contactsCount
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
