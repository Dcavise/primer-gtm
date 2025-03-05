
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google API constants
// Changed the spreadsheet ID - this was causing the 404 error
const SPREADSHEET_ID = "1xOXQdZaZTJkAjnI1fHI4tSTCFnF9p0hhfAX05-MYyG8"; // Using a valid spreadsheet ID
const SHEET_RANGE = "Pipeline!A1:Z"; // Updated to include headers

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
    console.log("Requesting access token from Google OAuth");
    console.log(`JWT payload: ${JSON.stringify(jwtPayload)}`);
    
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`Failed to get access token: ${tokenResponse.status} - ${errorText}`);
      throw new Error(`Failed to get access token: ${tokenResponse.status} - ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log("Successfully obtained access token");
    
    // Use the access token to fetch the sheet data
    console.log(`Fetching sheet data from: ${url}`);
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
    
    console.log("Successfully retrieved sheet data from Google");
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
    let credentials;
    try {
      credentials = typeof credentialsStr === 'string' ? JSON.parse(credentialsStr) : credentialsStr;
      console.log("Successfully parsed credentials");
      console.log(`Using service account: ${credentials.client_email}`);
    } catch (parseError) {
      console.error("Error parsing credentials:", parseError);
      throw new Error(`Failed to parse credentials: ${parseError.message}`);
    }
    
    if (!credentials.client_email || !credentials.private_key) {
      const missingField = !credentials.client_email ? "client_email" : "private_key";
      console.error(`Missing required credential field: ${missingField}`);
      throw new Error(`Missing required credential field: ${missingField}`);
    }
    
    // Build request URL
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}`;
    console.log(`Requesting data from: ${url}`);
    
    // Make authenticated request
    const result = await fetchWithGoogleAuth(url, credentials);
    
    console.log("Sheet API response:", JSON.stringify(result).substring(0, 200) + "...");
    
    if (!result.values || result.values.length === 0) {
      console.warn("No data found in the real estate pipeline sheet");
      return [];
    }
    
    console.log(`Successfully fetched ${result.values.length} rows of data from real estate pipeline`);
    
    // Get headers from first row
    const headers = result.values[0];
    console.log("Headers from sheet:", headers);
    
    // Process remaining rows into objects
    const rows = result.values.slice(1).map((row: any[], index: number) => {
      const rowData: Record<string, any> = {};
      
      // Map each cell to its corresponding header
      headers.forEach((header: string, idx: number) => {
        rowData[header] = row[idx] !== undefined ? row[idx] : null;
      });
      
      // Log a sample of the first few rows
      if (index < 2) {
        console.log(`Sample row ${index + 1}:`, JSON.stringify(rowData).substring(0, 200) + "...");
      }
      
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

  console.log("Starting column mapping");
  console.log("Input sheet data:", Object.keys(sheetData).join(", "));
  
  const mappedData: Record<string, any> = {};
  
  // Map each field from the sheet to its corresponding database column
  Object.entries(sheetData).forEach(([key, value]) => {
    const dbColumn = columnMap[key] || key.toLowerCase().replace(/\s+/g, '_');
    console.log(`Mapping column: "${key}" => "${dbColumn}"`);
    
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
  
  console.log("Output mapped data:", Object.keys(mappedData).join(", "));
  return mappedData;
}

// Process and upsert real estate pipeline data to Supabase
async function upsertRealEstateData(supabase: any, realEstateData: Record<string, any>[]) {
  try {
    console.log(`Processing ${realEstateData.length} rows of real estate pipeline data`);
    
    // Map Google Sheets columns to database schema
    const processedData = realEstateData.map((row, index) => {
      const mapped = mapColumnNames(row);
      // Log a sample of the first few processed rows
      if (index < 2) {
        console.log(`Sample processed row ${index + 1}:`, JSON.stringify(mapped).substring(0, 200) + "...");
      }
      return mapped;
    });
    
    // Filter out invalid records (must have address or site name)
    const validData = processedData.filter(property => 
      property.address || property.site_name_type);
    
    console.log(`Found ${validData.length} valid real estate records out of ${processedData.length} total`);

    if (validData.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    // Log sample of first record that will be inserted
    console.log("Sample record for insertion:", JSON.stringify(validData[0]));
    
    // Check if the necessary columns exist in the database
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('real_estate_pipeline')
        .select('*')
        .limit(1);
        
      if (tableError) {
        console.error("Error checking table structure:", tableError);
      } else {
        console.log("Table structure verified successfully");
      }
    } catch (tableCheckError) {
      console.error("Error during table check:", tableCheckError);
    }

    // Upsert to Supabase
    console.log("Upserting data to real_estate_pipeline table...");
    const { data, error } = await supabase
      .from('real_estate_pipeline')
      .upsert(validData, { 
        onConflict: 'address, site_name_type',
        returning: 'minimal'
      });

    if (error) {
      console.error("Supabase upsert error:", error);
      throw error;
    }

    console.log(`Successfully upserted ${validData.length} records`);
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
    console.log("Google credentials retrieved from environment");
    
    // Fetch and process data
    console.log("Fetching Google Sheet data for real estate pipeline...");
    const sheetData = await fetchGoogleSheetData(credentialsStr);
    
    if (!Array.isArray(sheetData) || sheetData.length === 0) {
      console.error('No data found in real estate pipeline Google Sheet');
      throw new Error('No data found in real estate pipeline Google Sheet');
    }
    
    console.log(`Retrieved ${sheetData.length} rows from Google Sheet`);

    console.log("Upserting data to Supabase real_estate_pipeline table...");
    const result = await upsertRealEstateData(supabase, sheetData);

    // Return success response
    console.log("Sync completed successfully with result:", result);
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
