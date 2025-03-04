
import { supabase } from "@/integrations/supabase/client";

// Base URLs
export const API_BASE_URL = "https://api.zoneomics.com/v2";

// Function to securely get API keys from Supabase edge function
export async function getApiKey(keyType: 'zoneomics' | 'census' | 'google_maps'): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('get-api-keys', {
      body: { key: keyType }
    });

    if (error) {
      console.error(`Error fetching ${keyType} API key:`, error);
      throw new Error(`Failed to fetch API key: ${error.message}`);
    }

    if (!data || !data.apiKey) {
      throw new Error(`No API key returned for ${keyType}`);
    }

    return data.apiKey;
  } catch (error) {
    console.error(`Error in getApiKey for ${keyType}:`, error);
    throw error;
  }
}

// Default placeholder values (will be replaced with actual values from Supabase)
// These are used to maintain backward compatibility during the transition
export const API_KEY = "9287beef057a695d64806257059567fbee26524d"; // Will be deprecated
export const CENSUS_API_KEY = "9cc42f8030aeecf163f664dde9ad2167f9a41a5b"; // Will be deprecated
export const GOOGLE_MAPS_API_KEY = "AIzaSyCPAIVrJFBNaO9gMtvHwKfzUwqS1WUkz3c"; // Will be deprecated
