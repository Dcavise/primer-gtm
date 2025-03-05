
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function parameters
interface SyncParams {
  spreadsheetId: string;
  sheetName: string;
  range: string;
  keyColumn?: string; // Optional column to use as a unique identifier
}

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
async function fetchGoogleSheetData(params: SyncParams, credentialsStr: string) {
  try {
    console.log(`Fetching data from Google Sheet: ${params.spreadsheetId}, Sheet: ${params.sheetName}`);
    
    // Parse credentials
    const credentials = typeof credentialsStr === 'string' ? JSON.parse(credentialsStr) : credentialsStr;
    
    if (!credentials.client_email || !credentials.private_key) {
      const missingField = !credentials.client_email ? "client_email" : "private_key";
      throw new Error(`Missing required credential field: ${missingField}`);
    }
    
    console.log(`Using service account: ${credentials.client_email}`);
    
    // Build request URL
    const range = params.range || `${params.sheetName}!A1:Z1000`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/values/${range}`;
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
async function upsertSheetData(supabase: any, params: SyncParams, sheetData: { headers: string[], rows: Record<string, any>[] }) {
  try {
    console.log(`Processing ${sheetData.rows.length} rows of data`);
    
    // Generate a timestamp for this sync operation
    const syncTimestamp = new Date().toISOString();
    
    // Process each row
    for (const row of sheetData.rows) {
      // Determine a unique row identifier
      let rowId: string;
      
      if (params.keyColumn && row[params.keyColumn]) {
        // Use the specified column as ID
        rowId = String(row[params.keyColumn]);
      } else {
        // Generate a hash of the row content as ID
        rowId = btoa(JSON.stringify(row)).slice(0, 20);
      }
      
      // Check if this row already exists
      const { data: existingRow, error: queryError } = await supabase
        .from('google_sheets_data')
        .select('id, data')
        .eq('sheet_id', params.spreadsheetId)
        .eq('sheet_name', params.sheetName)
        .eq('row_id', rowId)
        .maybeSingle();
      
      if (queryError) {
        console.error("Error checking for existing row:", queryError);
        continue;
      }
      
      if (existingRow) {
        // Update existing row if data has changed
        if (JSON.stringify(existingRow.data) !== JSON.stringify(row)) {
          const { error: updateError } = await supabase
            .from('google_sheets_data')
            .update({
              data: row,
              last_synced: syncTimestamp
            })
            .eq('id', existingRow.id);
          
          if (updateError) {
            console.error("Error updating row:", updateError);
          }
        } else {
          // Just update the sync timestamp
          const { error: updateError } = await supabase
            .from('google_sheets_data')
            .update({ last_synced: syncTimestamp })
            .eq('id', existingRow.id);
          
          if (updateError) {
            console.error("Error updating sync timestamp:", updateError);
          }
        }
      } else {
        // Insert new row
        const { error: insertError } = await supabase
          .from('google_sheets_data')
          .insert({
            sheet_id: params.spreadsheetId,
            sheet_name: params.sheetName,
            row_id: rowId,
            data: row,
            last_synced: syncTimestamp
          });
        
        if (insertError) {
          console.error("Error inserting row:", insertError);
        }
      }
    }
    
    // Clean up old rows that weren't in this sync
    const { error: cleanupError } = await supabase
      .from('google_sheets_data')
      .delete()
      .eq('sheet_id', params.spreadsheetId)
      .eq('sheet_name', params.sheetName)
      .lt('last_synced', syncTimestamp);
    
    if (cleanupError) {
      console.error("Error cleaning up old rows:", cleanupError);
    }
    
    return {
      processed: sheetData.rows.length,
      timestamp: syncTimestamp
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
    console.log("Starting sync-google-sheets-data function");
    
    // Parse request body
    let params: SyncParams;
    try {
      params = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request body, JSON expected" 
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Validate required parameters
    if (!params.spreadsheetId || !params.sheetName) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required parameters: spreadsheetId and sheetName are required" 
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
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
    const sheetData = await fetchGoogleSheetData(params, credentialsStr);
    
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
    const result = await upsertSheetData(supabase, params, sheetData);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${result.processed} rows of data`,
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
