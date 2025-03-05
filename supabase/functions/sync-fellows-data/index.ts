
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

async function fetchWithGoogleAuth(url, credentials) {
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
    const base64url = (str) => {
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    };

    const encodedHeader = base64url(JSON.stringify(jwtHeader));
    const encodedPayload = base64url(JSON.stringify(jwtPayload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    // Use a simple library to handle PEM parsing and RSA signing
    // Convert to correct format for crypto APIs
    // Note: Supabase edge functions run in Deno environment, which has some differences
    // from Node.js in how it handles crypto operations

    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    
    // Extract the base64-encoded private key
    let privateKey = credentials.private_key;
    
    // Clean up the private key - remove surrounding quotes and normalize newlines
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
    
    // Ensure the key has proper PEM format
    if (!privateKey.includes(pemHeader)) {
      privateKey = `${pemHeader}\n${privateKey}\n${pemFooter}`;
    }

    console.log("Prepared private key for signing");
    
    // Convert PEM to binary
    const cleanedKey = privateKey
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
      
    const binaryKey = Uint8Array.from(atob(cleanedKey), c => c.charCodeAt(0));
    
    // Import the key using WebCrypto API
    try {
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
      
      console.log("Successfully imported private key");
      
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
      
      console.log("Successfully created JWT");
      
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
        console.error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
        throw new Error(`Failed to get access token: ${tokenResponse.status} - ${errorText}`);
      }
      
      const tokenData = await tokenResponse.json();
      console.log("Successfully obtained access token");
      
      // Use the access token to fetch the sheet data
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Sheets API failed: ${response.status} - ${errorText}`);
        throw new Error(`Sheets API failed: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error during JWT creation or API call:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in fetchWithGoogleAuth:", error);
    throw error;
  }
}

// Function to fetch Google Sheets data
async function fetchGoogleSheetData(credentialsStr) {
  try {
    console.log("Starting Google Sheets data fetch");
    
    // Parse credentials if they're a string
    let credentials;
    try {
      credentials = typeof credentialsStr === 'string' ? JSON.parse(credentialsStr) : credentialsStr;
      console.log("Successfully parsed credentials");
    } catch (error) {
      console.error("Error parsing credentials:", error);
      throw new Error("Invalid credentials format");
    }
    
    // Verify credentials have required fields
    if (!credentials.client_email || !credentials.private_key) {
      const missingField = !credentials.client_email ? "client_email" : "private_key";
      console.error(`Missing required credential field: ${missingField}`);
      throw new Error(`Missing required credential field: ${missingField}`);
    }
    
    console.log(`Using service account: ${credentials.client_email}`);
    
    // Build request URL
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}`;
    console.log(`Requesting data from: ${url}`);
    
    // Make authenticated request
    const result = await fetchWithGoogleAuth(url, credentials);
    
    console.log(`Successfully fetched ${result.values?.length || 0} rows of data`);
    return result.values || [];
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

    // Log credential info for debugging (limited info only)
    console.log(`Credential string length: ${credentialsStr.length}`);
    
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
