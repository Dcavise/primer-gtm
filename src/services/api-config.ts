
import { supabase } from "@/integrations/supabase/client";

// Base URLs
export const API_BASE_URL = "https://api.zoneomics.com/v2";

// Function to securely get API keys from Supabase edge function
export async function getApiKey(keyType: 'zoneomics' | 'census' | 'google_maps' | 'mapbox'): Promise<string> {
  try {
    console.log(`Fetching ${keyType} API key from Supabase edge function`);
    
    // Try POST method first (which is the recommended approach)
    try {
      const { data, error } = await supabase.functions.invoke('get-api-keys', {
        body: { key: keyType }
      });

      if (error) {
        console.error(`Error fetching ${keyType} API key with POST:`, error);
        throw error;
      }

      if (!data || !data.key) {
        throw new Error(`No API key returned for ${keyType}`);
      }

      console.log(`Successfully retrieved ${keyType} API key`);
      return data.key;
    } catch (postError) {
      console.warn(`POST request failed for ${keyType} API key:`, postError);
      
      // Fall back to GET method if POST fails
      console.log(`Trying GET method for ${keyType} API key`);
      const response = await fetch(`${supabase.functions.url('get-api-keys')}?key=${keyType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token || ''}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GET request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data || !data.key) {
        throw new Error(`No API key returned for ${keyType} using GET method`);
      }

      console.log(`Successfully retrieved ${keyType} API key using GET method`);
      return data.key;
    }
  } catch (error) {
    console.error(`Error in getApiKey for ${keyType}:`, error);
    throw error;
  }
}

// Google Sheets Service Account Email
export const GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL = "primer-sheets-sync@primer-sheets-379223.iam.gserviceaccount.com";

// Default placeholder values (will be replaced with actual values from Supabase)
// These are used to maintain backward compatibility during the transition and as fallbacks
export const API_KEY = "9287beef057a695d64806257059567fbee26524d"; // Will be deprecated
export const CENSUS_API_KEY = "9cc42f8030aeecf163f664dde9ad2167f9a41a5b"; // Will be deprecated
export const GOOGLE_MAPS_API_KEY = "AIzaSyCPAIVrJFBNaO9gMtvHwKfzUwqS1WUkz3c"; // Will be deprecated
