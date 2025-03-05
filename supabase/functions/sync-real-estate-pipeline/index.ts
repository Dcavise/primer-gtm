
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Sheet ID for the Real Estate Pipeline
const SPREADSHEET_ID = "1sNaNYFCYEEPmh8t_uISJ9av2HatheCdce3ssRkgOFYU";
const SHEET_RANGE = "Sheet1!A1:AZ"; // Adjust range to cover all columns

async function fetchWithGoogleAuth(url: string, credentials: any) {
  try {
    console.log("Starting Google Sheets API fetch with authentication");

    // Create a JWT for Google authentication
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = { alg: "RS256", typ: "JWT" };
    const jwtPayload = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };

    // Convert header and payload to base64url format
    const base64url = (str: string) => {
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    };

    const encodedHeader = base64url(JSON.stringify(jwtHeader));
    const encodedPayload = base64url(JSON.stringify(jwtPayload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    // Clean up the private key
    let privateKey = credentials.private_key;
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
    
    // Ensure the key has proper PEM format
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    if (!privateKey.includes(pemHeader)) {
      privateKey = `${pemHeader}\n${privateKey}\n${pemFooter}`;
    }
    
    // Convert PEM to binary
    const cleanedKey = privateKey
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
      
    const binaryKey = Uint8Array.from(atob(cleanedKey), c => c.charCodeAt(0));
    
    // Import the key using WebCrypto API
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
    
    // Convert signature to base64url format
    const base64Signature = base64url(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${signatureInput}.${base64Signature}`;
    
    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${tokenResponse.status} - ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Use the access token to fetch the sheet data
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sheets API failed: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error in fetchWithGoogleAuth:", error);
    throw error;
  }
}

// Function to fetch Google Sheets data
async function fetchGoogleSheetData(credentialsStr: string) {
  try {
    console.log(`Fetching data from Google Sheet: ${SPREADSHEET_ID}`);
    
    // Parse credentials
    const credentials = typeof credentialsStr === 'string' ? JSON.parse(credentialsStr) : credentialsStr;
    
    if (!credentials.client_email || !credentials.private_key) {
      const missingField = !credentials.client_email ? "client_email" : "private_key";
      throw new Error(`Missing required credential field: ${missingField}`);
    }
    
    console.log(`Using service account: ${credentials.client_email}`);
    
    // Build request URL
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}`;
    console.log(`Requesting data from: ${url}`);
    
    // Make authenticated request
    const result = await fetchWithGoogleAuth(url, credentials);
    
    if (!result.values || result.values.length === 0) {
      console.warn("No data found in the specified range");
      return { headers: [], rows: [] };
    }
    
    console.log(`Successfully fetched ${result.values.length} rows of data`);
    
    // Extract headers from the first row
    const headers = result.values[0];
    
    // Process remaining rows into objects
    const rows = result.values.slice(1).map((row: any[]) => {
      const rowData: Record<string, any> = {};
      
      // Map each cell to its corresponding header
      headers.forEach((header: string, index: number) => {
        rowData[header] = row[index] !== undefined ? row[index] : null;
      });
      
      return rowData;
    });
    
    return { headers, rows };
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw error;
  }
}

// Process and upsert data to Supabase
async function upsertRealEstatePipelineData(supabase: any, sheetData: { headers: string[], rows: Record<string, any>[] }) {
  try {
    console.log(`Processing ${sheetData.rows.length} rows of Real Estate Pipeline data`);
    
    // First, delete all existing data to ensure a clean sync
    const { error: deleteError } = await supabase
      .from('real_estate_pipeline')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (deleteError) {
      console.error("Error deleting existing data:", deleteError);
      throw deleteError;
    }
    
    // Map Google Sheet column names to database column names
    const columnMapping: Record<string, string> = {
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
    
    // Prepare data for insertion
    const rowsToInsert = sheetData.rows.map(row => {
      const mappedRow: Record<string, any> = {};
      
      // Apply column mapping
      Object.entries(row).forEach(([key, value]) => {
        const dbColumn = columnMapping[key] || key.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
        
        // Convert "TRUE" and "FALSE" strings to boolean values for the floorplan column
        if (dbColumn === 'floorplan') {
          if (value === 'TRUE') {
            mappedRow[dbColumn] = true;
          } else if (value === 'FALSE') {
            mappedRow[dbColumn] = false;
          } else {
            mappedRow[dbColumn] = value === 'true' || value === true;
          }
        } 
        // Convert Lat and Lon to numeric values
        else if (dbColumn === 'lat' || dbColumn === 'lon') {
          mappedRow[dbColumn] = value ? parseFloat(value) : null;
        }
        else {
          mappedRow[dbColumn] = value;
        }
      });
      
      return mappedRow;
    });
    
    // Insert data in batches of 100 rows to avoid hitting request size limits
    const batchSize = 100;
    for (let i = 0; i < rowsToInsert.length; i += batchSize) {
      const batch = rowsToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('real_estate_pipeline')
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        throw insertError;
      }
      
      console.log(`Successfully inserted batch ${i / batchSize + 1} of ${Math.ceil(rowsToInsert.length / batchSize)}`);
    }
    
    return {
      processed: rowsToInsert.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error processing data:", error);
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
    console.log("Starting sync-real-estate-pipeline function");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Google credentials
    const credentialsStr = Deno.env.get('GOOGLESHEETS_SERVICE_ACCOUNT_CREDENTIALS');
    if (!credentialsStr) {
      throw new Error('Google credentials not found');
    }

    // Fetch and process data
    console.log("Fetching Google Sheet data...");
    const sheetData = await fetchGoogleSheetData(credentialsStr);
    
    if (!sheetData.rows || sheetData.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No data found in the specified range',
          result: { processed: 0 }
        }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    console.log("Upserting data to Supabase...");
    const result = await upsertRealEstatePipelineData(supabase, sheetData);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${result.processed} rows of Real Estate Pipeline data`,
        result
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error in edge function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
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
