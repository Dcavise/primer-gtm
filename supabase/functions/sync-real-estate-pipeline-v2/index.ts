import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google API constants
const SPREADSHEET_ID = "1sNaNYFCYEEPmh8t_uISJ9av2HatheCdce3ssRkgOFYU";
const SHEET_RANGE = "Sheet1!A1:Z1000"; // Increased range to capture more data

// Function to fetch data from Google Sheets
async function fetchSheetData(credentials: any) {
  try {
    console.log("Fetching Google Sheet data - V2 Implementation");
    
    // Create JWT token for authorization
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = { alg: "RS256", typ: "JWT" };
    const jwtPayload = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };
    
    // Base64 encoding function
    const base64url = (str: string) => {
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    };
    
    // Create JWT components
    const encodedHeader = base64url(JSON.stringify(jwtHeader));
    const encodedPayload = base64url(JSON.stringify(jwtPayload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    // Clean and format private key
    const privateKey = credentials.private_key
      .replace(/\\n/g, '\n')
      .replace(/^"|"$/g, '');
    
    // Import key for signing
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    
    let formattedKey = privateKey;
    if (!formattedKey.includes(pemHeader)) {
      formattedKey = `${pemHeader}\n${formattedKey}\n${pemFooter}`;
    }
    
    const cleanedKey = formattedKey
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(cleanedKey), c => c.charCodeAt(0));
    
    // Import the key for signing
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );
    
    // Sign the JWT
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      cryptoKey,
      encoder.encode(signatureInput)
    );
    
    const base64Signature = base64url(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${signatureInput}.${base64Signature}`;
    
    // Get access token
    console.log("Requesting Google OAuth token");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`Token request failed: ${errorText}`);
      throw new Error(`Failed to get access token: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log("Successfully obtained access token");
    
    // Fetch the spreadsheet data
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}`;
    console.log(`Fetching spreadsheet data from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Sheets API request failed: ${errorText}`);
      throw new Error(`Failed to fetch sheet data: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Successfully retrieved sheet data");
    
    if (!data.values || data.values.length === 0) {
      console.warn("No data found in sheet");
      return { headers: [], rows: [] };
    }
    
    // Extract headers and rows
    const headers = data.values[0];
    console.log("Sheet headers:", headers);
    
    // Process data rows
    const rows = data.values.slice(1).map((row: any[]) => {
      const record: Record<string, any> = {};
      headers.forEach((header: string, index: number) => {
        if (header && header.trim() !== '') {
          record[header] = index < row.length ? row[index] : null;
        }
      });
      return record;
    });
    
    console.log(`Processed ${rows.length} data rows`);
    return { headers, rows };
    
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw error;
  }
}

// Process and prepare data for database insertion
function processSheetData(rows: Record<string, any>[]) {
  console.log("Processing sheet data for database insertion");
  
  // Direct mapping of sheet columns to database columns
  const columnMap: Record<string, string> = {
    'Phase': 'phase',
    'State': 'state',
    'Market': 'market',
    'Site Name / Type': 'site_name_type',
    'Address': 'address',
    'Site Coordinator': 'site_coordinator',
    'Coordinator Contact Info': 'coordinator_contact_info',
    'SF Available': 'sf_available',
    'Questionnaire': 'questionnaire',
    'Initial Mock Up': 'initial_mock_up',
    'LL POC': 'll_poc',
    'LL Phone': 'll_phone',
    'LL Email': 'll_email',
    'Airtable': 'airtable',
    'RE Folder': 're_folder',
    'Floorplan': 'floorplan',
    'Fire Sprinklers': 'fire_sprinklers',
    'Fiber': 'fiber',
    'Fire Inspection / CoO': 'fire_inspection_coo',
    'Zoning': 'zoning',
    'Permitted Use': 'permitted_use',
    'Parking': 'parking',
    'AHJ Zoning Confirmation': 'ahj_zoning_confirmation',
    'AHJ Building Records': 'ahj_building_records',
    'AHJ HB-1285 Intro': 'ahj_hb1285_intro',
    'Survey': 'survey',
    'AOR Initial Analysis': 'aor_initial_analysis',
    'Test Fit': 'test_fit',
    'Fire Assessment': 'fire_assessment',
    'EDC Contact': 'edc_contact',
    'Pre-App': 'pre_app',
    'LOI': 'loi',
    'Lease': 'lease',
    'Status': 'status',
    'Property Notes': 'property_notes',
    'Deep Research - General': 'deep_research_general',
    'Deep Research - Previous School Use': 'deep_research_previous_school_use',
    'Status (JB)': 'status_jb',
    'Priority (JB)': 'priority_jb',
    'fellow': 'fellow',
    'Survey time': 'survey_time',
    'Lat': 'lat',
    'lon': 'lon',
    'Confirmed survey time': 'confirmed_survey_time',
    'fellow contact poc': 'fellow_contact_poc'
  };
  
  return rows.map(row => {
    const mappedRow: Record<string, any> = {};
    
    // Map each column from sheet to database
    Object.entries(row).forEach(([key, value]) => {
      // Try exact match first
      if (columnMap[key]) {
        const dbField = columnMap[key];
        
        // Handle special data types
        if (dbField === 'lat' || dbField === 'lon') {
          mappedRow[dbField] = value ? parseFloat(String(value)) : null;
        } 
        else if (dbField === 'floorplan' || dbField === 'fire_sprinklers' || dbField === 'fiber') {
          // Convert various boolean formats
          if (value === 'TRUE' || value === 'Yes' || value === 'Y' || value === true) {
            mappedRow[dbField] = true;
          } else if (value === 'FALSE' || value === 'No' || value === 'N' || value === false) {
            mappedRow[dbField] = false;
          } else {
            mappedRow[dbField] = value;
          }
        } 
        else {
          mappedRow[dbField] = value;
        }
      } 
      // Try case-insensitive match
      else {
        const matchingKey = Object.keys(columnMap).find(
          mapKey => mapKey.toLowerCase() === key.toLowerCase()
        );
        
        if (matchingKey) {
          const dbField = columnMap[matchingKey];
          
          // Handle special data types
          if (dbField === 'lat' || dbField === 'lon') {
            mappedRow[dbField] = value ? parseFloat(String(value)) : null;
          } 
          else if (dbField === 'floorplan' || dbField === 'fire_sprinklers' || dbField === 'fiber') {
            // Convert various boolean formats
            if (value === 'TRUE' || value === 'Yes' || value === 'Y' || value === true) {
              mappedRow[dbField] = true;
            } else if (value === 'FALSE' || value === 'No' || value === 'N' || value === false) {
              mappedRow[dbField] = false;
            } else {
              mappedRow[dbField] = value;
            }
          } 
          else {
            mappedRow[dbField] = value;
          }
        }
      }
    });
    
    // Add timestamp for record keeping
    mappedRow['last_updated'] = new Date().toISOString();
    
    return mappedRow;
  });
}

// Insert data into Supabase
async function insertDataToSupabase(supabase: any, data: Record<string, any>[]) {
  console.log(`Inserting ${data.length} records to Supabase`);
  
  // Log first record for debugging
  if (data.length > 0) {
    console.log("Sample record:", JSON.stringify(data[0]));
  }
  
  // Filter out records without address or site name
  const validRecords = data.filter(record => {
    return record.address || record.site_name_type;
  });
  
  console.log(`Found ${validRecords.length} valid records with address or site name`);
  
  if (validRecords.length === 0) {
    return { inserted: 0 };
  }
  
  try {
    // Clear the existing table first for a fresh import
    console.log("Clearing existing records for fresh import");
    const { error: deleteError } = await supabase
      .from('real_estate_pipeline')
      .delete()
      .not('id', 'is', null); // Safety check to avoid deleting all if filter fails
    
    if (deleteError) {
      console.error("Error clearing existing records:", deleteError);
      throw deleteError;
    }
    
    // Insert all records at once
    const { data: insertedData, error: insertError } = await supabase
      .from('real_estate_pipeline')
      .insert(validRecords)
      .select('id');
    
    if (insertError) {
      console.error("Error inserting records:", insertError);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${insertedData.length} records`);
    return { inserted: insertedData.length };
    
  } catch (error) {
    console.error("Database operation error:", error);
    throw error;
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting sync-real-estate-pipeline-v2 function");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found');
      throw new Error('Supabase credentials not found');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized");

    // Get Google credentials
    const credentialsStr = Deno.env.get('GOOGLESHEETS_SERVICE_ACCOUNT_CREDENTIALS');
    if (!credentialsStr) {
      console.error('Google credentials not found');
      throw new Error('Google credentials not found');
    }
    
    const credentials = JSON.parse(credentialsStr);
    console.log("Google credentials retrieved from environment");
    
    // Fetch data from Google Sheets
    console.log("Fetching data from Google Sheets");
    const { rows } = await fetchSheetData(credentials);
    
    if (rows.length === 0) {
      console.warn("No data found in Google Sheet");
      return new Response(
        JSON.stringify({
          success: false,
          message: "No data found in Google Sheet",
          result: { inserted: 0 }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Process and prepare data for database
    console.log("Processing sheet data");
    const processedData = processSheetData(rows);
    
    // Insert data into Supabase
    console.log("Inserting data into Supabase");
    const result = await insertDataToSupabase(supabase, processedData);
    
    // Return success response
    console.log("Sync completed successfully");
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${result.inserted} real estate records`,
        result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error("Error in sync function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
