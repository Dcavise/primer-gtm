
import { supabase } from "@/integrations/supabase/client";

// Base URLs
export const API_BASE_URL = "https://api.zoneomics.com/v2";
export const SUPABASE_URL = "https://pudncilureqpzxrxfupr.supabase.co";

// Function to securely get API keys from Supabase edge function
export async function getApiKey(keyType: 'zoneomics' | 'census' | 'google_maps' | 'mapbox' | 'greatschools'): Promise<string> {
  try {
    console.log(`Fetching ${keyType} API key from Supabase edge function`);
    
    try {
      // Try POST method first (which is the recommended approach)
      console.log(`Using POST method for fetching ${keyType} API key`);
      const { data, error } = await supabase.functions.invoke('get-api-keys', {
        body: { key: keyType }
      });

      if (error) {
        console.error(`Error fetching ${keyType} API key with POST:`, error);
        throw error;
      }

      if (!data || !data.key) {
        console.error(`No API key data returned for ${keyType}:`, data);
        throw new Error(`No API key returned for ${keyType}`);
      }

      console.log(`Successfully retrieved ${keyType} API key`);
      return data.key;
    } catch (postError) {
      console.warn(`POST request failed for ${keyType} API key:`, postError);
      
      // Fall back to GET method if POST fails
      console.log(`Trying GET method for ${keyType} API key`);
      
      // Use URL concatenation to add the key parameter
      const endpoint = `get-api-keys?key=${keyType}`;
      const { data, error } = await supabase.functions.invoke(endpoint, {
        method: 'GET'
      });
      
      if (error) {
        console.error(`Error fetching ${keyType} API key with GET:`, error);
        throw error;
      }
      
      if (!data || !data.key) {
        console.error(`No API key returned for ${keyType} using GET method:`, data);
        throw new Error(`No API key returned for ${keyType} using GET method`);
      }
      
      console.log(`Successfully retrieved ${keyType} API key using GET method`);
      return data.key;
    }
  } catch (error) {
    console.error(`Error in getApiKey for ${keyType}:`, error);
    throw new Error(`Failed to fetch API key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Google Sheets Service Account Email
export const GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL = "primer-sheets-sync@primer-sheets-379223.iam.gserviceaccount.com";
