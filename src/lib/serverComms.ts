import { supabase } from '@/integrations/supabase-client';
import axios from 'axios';
import { toast } from "sonner";
import { Coordinates } from "@/types";
// Importing types that were previously defined in contacts-api.ts
import { 
  HunterContact, 
  HunterDomainResponse, 
  EmailFinderResponse, 
  ContactsSearchParams, 
  EmailFinderParams 
} from "@/services/contacts-api";

// Re-export the types
export type { 
  HunterContact, 
  HunterDomainResponse, 
  EmailFinderResponse, 
  ContactsSearchParams, 
  EmailFinderParams 
};

// Base URLs
export const SUPABASE_URL = "https://pudncilureqpzxrxfupr.supabase.co";

// Google Sheets Service Account Email
export const GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL = "primer-sheets-sync@primer-sheets-379223.iam.gserviceaccount.com";

// Set up a default axios instance
export const api = axios.create();

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

/**
 * Geocode an address using Google Maps API via Supabase function
 */
export const geocodeAddress = async (address: string): Promise<{ 
  address: string;
  coordinates: Coordinates;
} | null> => {
  try {
    console.log(`Geocoding address: ${address}`);
    
    // Improved error handling and logging
    if (!address || address.trim() === '') {
      toast.error("Invalid address", {
        description: "Please provide a valid address to search."
      });
      return null;
    }
    
    // Make API request to our supabase function
    console.log(`Using Supabase edge function to geocode address`);
    
    const { data, error } = await supabase.functions.invoke('geocode-address', {
      body: { address }
    });
    
    if (error) {
      console.error(`Geocoding edge function error:`, error);
      toast.error("Geocoding failed", {
        description: error.message || "Could not find coordinates for the provided address."
      });
      return null;
    }
    
    if (!data || !data.coordinates) {
      console.error("Invalid geocoding result structure:", data);
      toast.error("Address location error", {
        description: "The system couldn't determine exact coordinates for this address."
      });
      return null;
    }
    
    console.log(`Successfully geocoded address to: ${data.formattedAddress} (${data.coordinates.lat}, ${data.coordinates.lng})`);
    
    return {
      address: data.formattedAddress || address,
      coordinates: {
        lat: data.coordinates.lat,
        lng: data.coordinates.lng
      }
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    
    toast.error("Geocoding failed", {
      description: "Could not find coordinates for the provided address. Please check the address and try again."
    });
    
    return null;
  }
};

/**
 * Create a bounding box around a point with a specified radius
 */
export const createBoundingBox = (
  center: Coordinates,
  radiusInMeters: number
): {
  bottomLeft: Coordinates;
  topRight: Coordinates;
} => {
  // Earth's radius in meters
  const earthRadius = 6378137;
  
  // Convert radius from meters to degrees
  const radiusInDegrees = radiusInMeters / earthRadius * (180 / Math.PI);
  
  // Calculate the bounding box
  return {
    bottomLeft: {
      lat: center.lat - radiusInDegrees,
      lng: center.lng - radiusInDegrees / Math.cos(center.lat * Math.PI / 180)
    },
    topRight: {
      lat: center.lat + radiusInDegrees,
      lng: center.lng + radiusInDegrees / Math.cos(center.lat * Math.PI / 180)
    }
  };
};

/**
 * Search for contacts by domain
 */
export async function searchContactsByDomain(params: ContactsSearchParams): Promise<HunterDomainResponse | null> {
  try {
    const { domain, limit } = params;
    // Clean up params - if department, seniority or type is 'any', remove it
    const department = params.department === 'any' ? undefined : params.department;
    const seniority = params.seniority === 'any' ? undefined : params.seniority;
    const type = params.type === 'any' ? undefined : params.type as "personal" | "generic" | undefined;
    
    console.log('Calling domain-search edge function with params:', { domain, limit, department, seniority, type });
    
    const { data, error } = await supabase.functions.invoke('domain-search', {
      body: { domain, limit, department, seniority, type }
    });

    if (error) {
      console.error('Error calling domain-search edge function:', error);
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }

    if (!data || !data.data) {
      console.error('No data returned from domain-search edge function');
      return null;
    }

    console.log(`Successfully retrieved ${data.data.emails?.length || 0} contacts for domain ${domain}`);
    return data.data as HunterDomainResponse;
  } catch (error) {
    console.error('Error in searchContactsByDomain:', error);
    throw error;
  }
}

/**
 * Find email by name and domain
 */
export async function findEmailByName(params: EmailFinderParams): Promise<EmailFinderResponse | null> {
  try {
    const { domain, company, first_name, last_name, max_duration } = params;
    
    console.log('Calling email-finder edge function with params:', { domain, company, first_name, last_name, max_duration });
    
    const { data, error } = await supabase.functions.invoke('email-finder', {
      body: { domain, company, first_name, last_name, max_duration }
    });

    if (error) {
      console.error('Error calling email-finder edge function:', error);
      throw new Error(`Failed to find email: ${error.message}`);
    }

    if (!data) {
      console.error('No data returned from email-finder edge function');
      return null;
    }

    console.log('Successfully found email for', first_name, last_name, 'at', domain);
    return data as EmailFinderResponse;
  } catch (error) {
    console.error('Error in findEmailByName:', error);
    throw error;
  }
}

/**
 * Check database connection status
 * @returns Object with connection status and schema availability
 */
export const checkDatabaseConnection = async () => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  
  // Helper function to add delay
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Helper function for retry logic
  const retryOperation = async (operation, retries) => {
    try {
      return await operation();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      
      await delay(RETRY_DELAY);
      return retryOperation(operation, retries - 1);
    }
  };
  
  try {
    // First check public schema access with retry
    const publicCheckOperation = async () => {
      const publicCheck = await supabase
        .from('campuses')
        .select('count')
        .limit(1);
      
      if (publicCheck.error) {
        console.error("Public schema connectivity check failed:", publicCheck.error);
        throw publicCheck.error;
      }
      
      return true;
    };
    
    let publicSchemaAccess = false;
    try {
      publicSchemaAccess = await retryOperation(publicCheckOperation, MAX_RETRIES);
    } catch (error) {
      console.error("Public schema access failed after retries:", error);
      return { connected: false, schemas: { public: false, salesforce: false }};
    }
    
    // Then check salesforce schema access
    let salesforceAccess = false;
    try {
      // Use an RPC function that attempts to access the salesforce schema
      const salesforceCheckOperation = async () => {
        const salesforceCheck = await supabase.rpc('test_salesforce_connection');
        
        if (salesforceCheck.error) {
          console.error("Salesforce schema connectivity check failed:", salesforceCheck.error);
          throw salesforceCheck.error;
        }
        
        return salesforceCheck.data?.salesforce_schema_access === true;
      };
      
      salesforceAccess = await retryOperation(salesforceCheckOperation, MAX_RETRIES);
    } catch (schemaError) {
      console.error("Salesforce schema access check failed after retries:", schemaError);
      // Continue even if this fails - we still have public schema access
    }
    
    // Return results
    return { 
      connected: publicSchemaAccess, 
      schemas: { 
        public: publicSchemaAccess, 
        salesforce: salesforceAccess 
      }
    };
  } catch (error) {
    console.error("Unexpected error during database connectivity check:", error);
    return { connected: false, schemas: { public: false, salesforce: false }};
  }
}; 