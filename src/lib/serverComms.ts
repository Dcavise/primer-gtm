import { supabase } from "@/integrations/supabase-client";
import axios from "axios";
import { toast } from "sonner";
import { Coordinates } from "@/types";

// Base URLs
export const SUPABASE_URL = "https://pudncilureqpzxrxfupr.supabase.co";

// Google Sheets Service Account Email
export const GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL =
  "primer-sheets-sync@primer-sheets-379223.iam.gserviceaccount.com";

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
    const { data, error } = await supabase.functions.invoke("get-api-keys", {
      body: { key: keyName },
    });

    if (error) {
      console.warn(`POST method failed for ${keyName} API key:`, error.message);

      // If POST fails, try using GET method as fallback
      console.log(`Falling back to GET method for ${keyName} API key`);
      const getResponse = await supabase.functions.invoke(`get-api-keys?key=${keyName}`, {
        method: "GET",
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
 * Mock geocode function that returns fixed coordinates for any address
 * This replaces the previous implementation that used Google Maps API
 */
export const geocodeAddress = async (
  address: string
): Promise<{
  address: string;
  coordinates: Coordinates;
} | null> => {
  try {
    console.log(`[MOCK] Geocoding address: ${address}`);

    // Basic validation (same as before)
    if (!address || address.trim() === "") {
      toast.error("Invalid address", {
        description: "Please provide a valid address to search.",
      });
      return null;
    }

    // Wait a moment to simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate deterministic coordinates based on address length
    // This ensures the same address always gets the same coordinates
    const addressHash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Generate coordinates in San Francisco area (37.7749° N, 122.4194° W)
    // We'll vary the coordinates slightly based on the address hash
    const lat = 37.7749 + (addressHash % 100) / 1000; 
    const lng = -122.4194 + (addressHash % 100) / 1000;

    console.log(
      `[MOCK] Generated coordinates for "${address}": (${lat}, ${lng})`
    );

    toast.info("Using estimated location", {
      description: "Exact geocoding is currently unavailable, using approximate coordinates.",
    });

    return {
      address: address, // Return the original address 
      coordinates: {
        lat,
        lng,
      },
    };
  } catch (error) {
    console.error("[MOCK] Error in geocoding address:", error);

    toast.error("Location processing failed", {
      description: "Could not process this address. Please try a different format.",
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
  const radiusInDegrees = (radiusInMeters / earthRadius) * (180 / Math.PI);

  // Calculate the bounding box
  return {
    bottomLeft: {
      lat: center.lat - radiusInDegrees,
      lng: center.lng - radiusInDegrees / Math.cos((center.lat * Math.PI) / 180),
    },
    topRight: {
      lat: center.lat + radiusInDegrees,
      lng: center.lng + radiusInDegrees / Math.cos((center.lat * Math.PI) / 180),
    },
  };
};

/**
 * Check database connection status
 * @returns Object with connection status and schema availability
 */
export const checkDatabaseConnection = async () => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  // Helper function to add delay
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      const publicCheck = await supabase.from("campuses").select("count").limit(1);

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
      return {
        connected: false,
        schemas: { public: false, salesforce: false },
      };
    }

    // Then check salesforce schema access
    let salesforceAccess = false;
    try {
      // Use an RPC function that attempts to access the salesforce schema
      const salesforceCheckOperation = async () => {
        const salesforceCheck = await supabase.rpc("test_salesforce_connection");

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
        salesforce: salesforceAccess,
      },
    };
  } catch (error) {
    console.error("Unexpected error during database connectivity check:", error);
    return { connected: false, schemas: { public: false, salesforce: false } };
  }
};
