
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
    console.log("Getting access token with service account");
    
    // Parse credentials if they're a string
    if (typeof credentials === 'string') {
      try {
        credentials = JSON.parse(credentials);
        console.log("Successfully parsed service account credentials JSON");
      } catch (error) {
        console.error("Failed to parse credentials as JSON:", error);
        throw new Error("Invalid service account credentials format");
      }
    }
    
    // Verify required credential fields
    if (!credentials.client_email || !credentials.private_key) {
      console.error("Missing required credential fields:", 
        !credentials.client_email ? "client_email" : "private_key");
      throw new Error("Missing required credential fields");
    }
    
    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };

    console.log(`Using client email: ${credentials.client_email}`);
    
    // Normalize the private key - ensure it has proper newlines
    const normalizedKey = credentials.private_key
      .replace(/\\n/g, '\n')
      .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
    
    // Sign the JWT
    const encoder = new TextEncoder();
    const jwtHeader = { alg: "RS256", typ: "JWT" };
    
    // Format the data for JWT
    const encodedHeader = btoa(JSON.stringify(jwtHeader));
    const encodedPayload = btoa(JSON.stringify(jwtPayload));
    const toSign = `${encodedHeader}.${encodedPayload}`;
    
    // Import the private key
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      new Uint8Array(
        atob(normalizedKey.trim())
          .split('')
          .map(c => c.charCodeAt(0))
      ),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    // Sign the JWT
    const signature = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      encoder.encode(toSign)
    );
    
    // Create the complete JWT
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${toSign}.${encodedSignature}`;
    
    // Exchange JWT for access token
    console.log("Requesting access token from Google OAuth");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
      throw new Error(`Failed to get access token: ${tokenResponse.status} - ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log("Successfully obtained access token");
    return tokenData.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

// Function to fetch Google Sheets data
async function fetchGoogleSheetData(credentialsStr) {
  try {
    console.log("Starting Google Sheets data fetch");
    
    // Build request URL
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}`;
    const options = { 
      method: "GET", 
      headers: {} 
    };
    
    // Get access token and add to headers
    console.log("Getting access token for service account");
    const accessToken = await getAccessToken(credentialsStr);
    options.headers = { 
      "Authorization": `Bearer ${accessToken}` 
    };
    console.log("Added access token to request headers");

    // Make the request to Google Sheets API
    console.log(`Requesting data from: ${url}`);
    const response = await fetch(url, options);
    
    // Log detailed response info for debugging
    console.log(`API response status: ${response.status}`);
    
    // Handle API response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    // Parse and return the data
    const data = await response.json();
    console.log(`Successfully fetched ${data.values?.length || 0} rows of data`);
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
    const processedFellows = fellowsData.map(row => {
      // Ensure we have at least 6 columns (even if some are empty)
      const paddedRow = [...row];
      while (paddedRow.length < 6) paddedRow.push('');
      
      return {
        fellow_id: paddedRow[0] ? parseInt(paddedRow[0]) : null,
        fellow_name: paddedRow[1] || '',
        campus: paddedRow[2] || null,
        cohort: paddedRow[3] ? parseInt(paddedRow[3]) : null,
        grade_band: paddedRow[4] || null,
        fte_employment_status: paddedRow[5] || null,
        updated_at: new Date().toISOString()
      };
    });

    // Filter out invalid records (must have ID and name)
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

    return { 
      inserted: validFellows.length, 
      updated: 0 
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
    console.log(`Credential string length: ${credentialsStr.length}`);
    console.log(`Credential string starts with: ${credentialsStr.substring(0, 20)}...`);
    
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
