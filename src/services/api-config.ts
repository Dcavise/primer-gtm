
import { supabase } from "@/integrations/supabase/client";

// Base URLs
export const API_BASE_URL = "https://api.zoneomics.com/v2";
export const SUPABASE_URL = "https://pudncilureqpzxrxfupr.supabase.co";

// Function to securely get API keys from Supabase edge function
export async function getApiKey(keyType: 'zoneomics' | 'census' | 'google_maps' | 'mapbox' | 'greatschools'): Promise<string> {
  try {
    console.log(`Fetching ${keyType} API key from Supabase edge function`);
    
    // Standardize key name for Google Maps API
    const requestedKey = keyType === 'google_maps' ? 'google_maps' : keyType;
    
    try {
      // Try POST method first (which is the recommended approach)
      console.log(`Using POST method for fetching ${requestedKey} API key`);
      const { data, error } = await supabase.functions.invoke('get-api-keys', {
        body: { key: requestedKey }
      });

      if (error) {
        console.error(`Error fetching ${requestedKey} API key with POST:`, error);
        throw error;
      }

      if (!data || !data.key) {
        console.error(`No API key data returned for ${requestedKey}:`, data);
        throw new Error(`No API key returned for ${requestedKey}`);
      }

      console.log(`Successfully retrieved ${requestedKey} API key`);
      return data.key;
    } catch (postError) {
      console.warn(`POST request failed for ${requestedKey} API key:`, postError);
      
      // Fall back to GET method if POST fails
      console.log(`Trying GET method for ${requestedKey} API key`);
      
      // Use URL concatenation to add the key parameter
      const endpoint = `get-api-keys?key=${requestedKey}`;
      const { data, error } = await supabase.functions.invoke(endpoint, {
        method: 'GET'
      });
      
      if (error) {
        console.error(`Error fetching ${requestedKey} API key with GET:`, error);
        throw error;
      }
      
      if (!data || !data.key) {
        console.error(`No API key returned for ${requestedKey} using GET method:`, data);
        throw new Error(`No API key returned for ${requestedKey} using GET method`);
      }
      
      console.log(`Successfully retrieved ${requestedKey} API key using GET method`);
      return data.key;
    }
  } catch (error) {
    console.error(`Error in getApiKey for ${keyType}:`, error);
    throw new Error(`Failed to fetch API key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Google Sheets Service Account Email
export const GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL = "primer-sheets-sync@primer-sheets-379223.iam.gserviceaccount.com";
