
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google API constants
const SPREADSHEET_ID = "1DQFriMfCTVK4QlXwCp94tGgMrWaQ5BDCWKxYXxLF1wU"; // Replace with your actual spreadsheet ID
const SHEET_RANGE = "Pipeline!A2:Z"; // Starting from row 2 to skip headers, all columns

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
    console.log("Starting Google Sheets data fetch for real estate pipeline");
    
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
      console.warn("No data found in the real estate pipeline sheet");
      return [];
    }
    
    console.log(`Successfully fetched ${result.values.length} rows of data from real estate pipeline`);
    
    // First row should be headers
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
    
    return rows;
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw error;
  }
}

// Map Google Sheets column names to Supabase column names
function mapColumnNames(sheetData: Record<string, any>): Record<string, any> {
  const columnMap: Record<string, string> = {
    'Property Name': 'site_name_type',
    'Status': 'status',
    'Address': 'address',
    'Market': 'market',
    'Zip Code': 'zipcode',
    'State': 'state',
    'SF Available': 'sf_available',
    'Priority': 'priority_jb',
    'Fellow': 'fellow',
    'LL POC': 'll_poc',
    'LL Phone': 'll_phone',
    'LL Email': 'll_email',
    'Phase': 'phase',
    'Notes': 'property_notes',
    'Lease': 'lease',
    'LOI': 'loi',
    'Site Coordinator': 'site_coordinator',
    'Coordinator Contact Info': 'coordinator_contact_info',
    'Fellow Contact POC': 'fellow_contact_poc',
    'Permitted Use': 'permitted_use',
    'Parking': 'parking',
    'Zoning': 'zoning',
    'Fire Sprinklers': 'fire_sprinklers',
    'Fire Assessment': 'fire_assessment',
    'Fire Inspection/COO': 'fire_inspection_coo',
    'Floorplan': 'floorplan',
    'Airtable': 'airtable',
    'RE Folder': 're_folder',
    'Fiber': 'fiber',
    'Latitude': 'lat',
    'Longitude': 'lon'
  };

  const mappedData: Record<string, any> = {};
  
  // Map each field from the sheet to its corresponding database column
  Object.entries(sheetData).forEach(([key, value]) => {
    const dbColumn = columnMap[key] || key.toLowerCase().replace(/\s+/g, '_');
    
    // Handle boolean values
    if (value === 'TRUE' || value === 'YES' || value === 'Y') {
      mappedData[dbColumn] = true;
    } else if (value === 'FALSE' || value === 'NO' || value === 'N') {
      mappedData[dbColumn] = false;
    } else {
      // Handle numeric values
      if (dbColumn === 'lat' || dbColumn === 'lon') {
        mappedData[dbColumn] = value ? parseFloat(value) : null;
      } else {
        mappedData[dbColumn] = value;
      }
    }
  });
  
  // Add last_updated timestamp
  mappedData['last_updated'] = new Date().toISOString();
  
  return mappedData;
}

// Process and upsert real estate pipeline data to Supabase
async function upsertRealEstateData(supabase: any, realEstateData: Record<string, any>[]) {
  try {
    console.log(`Processing ${realEstateData.length} rows of real estate pipeline data`);
    
    // Map Google Sheets columns to database schema
    const processedData = realEstateData.map(row => mapColumnNames(row));
    
    // Filter out invalid records (must have address or site name)
    const validData = processedData.filter(property => 
      property.address || property.site_name_type);
    
    console.log(`Found ${validData.length} valid real estate records`);

    if (validData.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    // Upsert to Supabase
    const { error } = await supabase
      .from('real_estate_pipeline')
      .upsert(validData, { 
        onConflict: 'address, site_name_type',
        returning: 'minimal'
      });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return { 
      inserted: validData.length, 
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
    console.log("Fetching Google Sheet data for real estate pipeline...");
    const sheetData = await fetchGoogleSheetData(credentialsStr);
    
    if (!Array.isArray(sheetData) || sheetData.length === 0) {
      throw new Error('No data found in real estate pipeline Google Sheet');
    }

    console.log("Upserting data to Supabase real_estate_pipeline table...");
    const result = await upsertRealEstateData(supabase, sheetData);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${result.inserted} real estate pipeline records`,
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
