
import { supabase } from '@/integrations/supabase-client';

// Base URLs
export const API_BASE_URL = "https://api.zoneomics.com/v2";
export const SUPABASE_URL = "https://pudncilureqpzxrxfupr.supabase.co";

// Google Sheets Service Account Email
export const GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL = "primer-sheets-sync@primer-sheets-379223.iam.gserviceaccount.com";

/**
 * Retrieves API keys from the Supabase Edge Function
 * @param keyName The name of the API key to retrieve (e.g., 'google_maps', 'zoneomics')
 * @returns A Promise that resolves to the API key
 */
export async function getApiKey(keyName: string): Promise<string> {
  try {
    console.log(`Fetching ${keyName} API key via POST method`);
    
    // First try using POST method
    const { data, error } = await supabase.functions.invoke('get-api-keys', {
      body: { key: keyName }
    });
    
    if (error) {
      console.warn(`POST method failed for ${keyName} API key:`, error.message);
      
      // If POST fails, try using GET method as fallback
      console.log(`Falling back to GET method for ${keyName} API key`);
      const getResponse = await supabase.functions.invoke(`get-api-keys?key=${keyName}`, {
        method: 'GET'
      });
      
      if (getResponse.error) {
        console.error(`GET method also failed for ${keyName} API key:`, getResponse.error.message);
        throw new Error(`Error fetching ${keyName} API key with GET: ${getResponse.error.message}`);
      }
      
      if (!getResponse.data || !getResponse.data.key) {
        throw new Error(`No API key returned for ${keyName}`);
      }
      
      return getResponse.data.key;
    }
    
    if (!data || !data.key) {
      throw new Error(`No API key returned for ${keyName}`);
    }
    
    return data.key;
  } catch (error) {
    console.error(`Failed to retrieve ${keyName} API key:`, error);
    // Return a placeholder so the app doesn't crash completely
    return "";
  }
}
