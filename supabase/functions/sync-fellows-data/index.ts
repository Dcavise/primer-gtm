
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google API constants
const SPREADSHEET_ID = "1Lz5_CWhpQ1rJiIhThRoPRC1rgBhXyn2AIUsZO-hvVtA";
const SHEET_RANGE = "Sheet1!A2:F"; // Starting from row 2 to skip headers, columns A-F

// Function to get access token using service account credentials
async function getAccessToken(credentials) {
  try {
    // Create JWT payload
    const jwtPayload = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    };

    // Sign the JWT with the private key
    const encoder = new TextEncoder();
    const privateKeyPEM = credentials.private_key;
    
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      new Uint8Array(
        atob(privateKeyPEM
          .replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----/g, '')
          .trim())
          .split('')
          .map(c => c.charCodeAt(0))
      ),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      encoder.encode(JSON.stringify(jwtPayload))
    );

    // Convert to JWT format
    const jwt = `${btoa(JSON.stringify(jwtPayload))}.${btoa(String.fromCharCode.apply(null, new Uint8Array(signature)))}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

// Function to fetch Google Sheets data
async function fetchGoogleSheetData(credentialsStr) {
  try {
    // Determine credential type (API key or service account)
    let isApiKey = false;
    let credentials;
    
    try {
      // Try parsing as JSON first (service account)
      credentials = JSON.parse(credentialsStr);
      console.log("Using service account authentication");
    } catch (error) {
      // If parsing fails, treat as API key
      isApiKey = true;
      credentials = { api_key: credentialsStr.trim() };
      console.log("Using API key authentication");
    }

    let url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}`;
    const options = { method: "GET", headers: {} };
    
    // Handle authentication based on credential type
    if (isApiKey) {
      // Append API key to URL
      url += `?key=${credentials.api_key}`;
    } else {
      // Use service account - get access token and add to headers
      const accessToken = await getAccessToken(credentials);
      options.headers = { Authorization: `Bearer ${accessToken}` };
    }

    // Fetch data from Google Sheets
    console.log(`Fetching data from: ${url.substring(0, 60)}...`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.values?.length || 0} rows`);
    return data.values || [];
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw error;
  }
}

// Process and upsert fellows data to Supabase
async function upsertFellowsData(supabase, fellowsData) {
  try {
    console.log(`Processing ${fellowsData.length} rows of data`);
    
    // Map Google Sheets columns to database schema
    const processedFellows = fellowsData.map(row => ({
      fellow_id: row[0] ? parseInt(row[0]) : null,
      fellow_name: row[1] || '',
      campus: row[2] || null,
      cohort: row[3] ? parseInt(row[3]) : null,
      grade_band: row[4] || null,
      fte_employment_status: row[5] || null,
      updated_at: new Date().toISOString()
    }));

    // Filter out invalid records
    const validFellows = processedFellows.filter(fellow => 
      fellow.fellow_id !== null && fellow.fellow_name !== '');
    
    console.log(`Found ${validFellows.length} valid fellows records`);

    if (validFellows.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    // Upsert to Supabase
    const { error } = await supabase
      .from('fellows')
      .upsert(validFellows, { 
        onConflict: 'fellow_id',
        returning: 'minimal'
      });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return { inserted: validFellows.length, updated: 0 };
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
    console.log("Starting sync-fellows-data function");
    
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

    // Log credential info for debugging
    console.log(`Credential string type: ${typeof credentialsStr}`);
    console.log(`Credential string length: ${credentialsStr.length}`);
    console.log(`Credential preview: ${credentialsStr.substring(0, 30)}...`);

    // Fetch and process data
    console.log("Fetching Google Sheet data...");
    const sheetData = await fetchGoogleSheetData(credentialsStr);
    
    if (!Array.isArray(sheetData) || sheetData.length === 0) {
      throw new Error('No data found in Google Sheet');
    }

    console.log("Upserting data to Supabase...");
    const result = await upsertFellowsData(supabase, sheetData);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${result.inserted} fellows records`,
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
