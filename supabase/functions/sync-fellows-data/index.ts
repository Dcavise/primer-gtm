
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google API constants
const GOOGLE_SHEETS_API_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const SPREADSHEET_ID = "1Lz5_CWhpQ1rJiIhThRoPRC1rgBhXyn2AIUsZO-hvVtA";
const SHEET_RANGE = "Sheet1!A2:F"; // Starting from row 2 to skip headers, all columns (A-F)

// Function to fetch data from Google Sheets
async function fetchGoogleSheetData(serviceAccountCredentials: string) {
  try {
    // Parse the credentials string to JSON
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountCredentials);
    } catch (error) {
      console.error("Error parsing service account credentials:", error);
      throw new Error("Invalid service account credentials format");
    }
    
    // Create a JWT for Google API authentication
    const jwtPayload = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    };

    // Sign the JWT with the private key from service account
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

    // Convert the signature to base64
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
    const accessToken = tokenData.access_token;

    // Use the access token to fetch the spreadsheet data
    const response = await fetch(
      `${GOOGLE_SHEETS_API_URL}/${SPREADSHEET_ID}/values/${SHEET_RANGE}?majorDimension=ROWS`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const data = await response.json();
    console.log("Successfully fetched Google Sheet data:", data.values?.length || 0, "rows");
    return data.values || [];
  } catch (error) {
    console.error("Error fetching Google Sheet data:", error);
    throw error;
  }
}

// Function to process and upsert data to Supabase
async function upsertFellowsData(supabase: any, fellowsData: any[]) {
  try {
    console.log("Processing", fellowsData.length, "rows of data");
    
    const processedFellows = fellowsData.map(row => {
      // Map columns to our database schema
      // [Fellow ID, Fellow Name, Campus, Cohort, Grade Band, FTE Employment Status]
      return {
        fellow_id: row[0] ? parseInt(row[0]) : null,
        fellow_name: row[1] || '',
        campus: row[2] || null,
        cohort: row[3] ? parseInt(row[3]) : null,
        grade_band: row[4] || null,
        fte_employment_status: row[5] || null,
        updated_at: new Date().toISOString()
      };
    });

    // Filter out rows with missing fellow_id or fellow_name
    const validFellows = processedFellows.filter(fellow => 
      fellow.fellow_id !== null && fellow.fellow_name !== '');

    console.log("Processing", validFellows.length, "valid fellows records");

    if (validFellows.length === 0) {
      console.log("No valid fellows data to upsert");
      return { inserted: 0, updated: 0 };
    }

    // Upsert the data (update if exists, insert if not)
    const { data, error } = await supabase
      .from('fellows')
      .upsert(validFellows, { 
        onConflict: 'fellow_id',
        returning: 'minimal'
      });

    if (error) {
      console.error("Error upserting data:", error);
      throw error;
    }

    return { inserted: validFellows.length, updated: 0 };
  } catch (error) {
    console.error("Error processing fellows data:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting sync-fellows-data function");
    
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or service role key not found');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get service account credentials from environment
    const serviceAccountCredentialsJson = Deno.env.get('GOOGLESHEETS_SERVICE_ACCOUNT_CREDENTIALS');
    if (!serviceAccountCredentialsJson) {
      throw new Error('Google service account credentials not found');
    }

    // Fetch Google Sheet data - pass the credentials as a string
    console.log("Fetching Google Sheet data...");
    const sheetData = await fetchGoogleSheetData(serviceAccountCredentialsJson);
    
    if (!Array.isArray(sheetData) || sheetData.length === 0) {
      throw new Error('No data found in Google Sheet');
    }

    // Process and upsert the data
    console.log("Upserting fellows data to Supabase...");
    const result = await upsertFellowsData(supabase, sheetData);

    // Return success response
    const responseBody = {
      success: true,
      message: `Successfully processed ${result.inserted} fellows records`,
      result
    };

    return new Response(
      JSON.stringify(responseBody),
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
