import { supabase } from "@/integrations/supabase/client";
import axios from 'axios';
import { toast } from "sonner";
import { Coordinates, PermitResponse, PermitSearchParams } from "@/types";
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
export const API_BASE_URL = "https://api.zoneomics.com/v2";
export const SUPABASE_URL = "https://pudncilureqpzxrxfupr.supabase.co";

// Google Sheets Service Account Email
export const GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL = "primer-sheets-sync@primer-sheets-379223.iam.gserviceaccount.com";

// Set up a default axios instance with the base URL
export const api = axios.create({
  baseURL: API_BASE_URL,
});

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

// Mock data for fallback when the zoning API is unavailable
const fallbackZoningData = {
  success: true,
  data: {
    zone_details: {
      zone_name: "Residential Single-Family",
      zone_code: "RS-3",
      zone_type: "Residential",
      zone_sub_type: "Single-Family",
      zone_guide: "Residential Single-Family district is intended to accommodate detached houses on individual lots."
    },
    permitted_land_uses: {
      as_of_right: [
        "Single-Family Residential",
        "Parks and Recreation",
        "Community Gardens",
        "Religious Assembly",
        "Schools"
      ],
      conditional_uses: [
        "Daycare Centers",
        "Cultural Exhibits and Libraries",
        "Public Safety Services",
        "Utilities and Services"
      ],
      prohibited: [
        "Multi-Family Residential",
        "Commercial Uses",
        "Industrial Uses",
        "Warehousing"
      ]
    },
    controls: {
      standard: {
        min_lot_area: "2,500 sq ft",
        max_building_height: "30 ft",
        max_floor_area_ratio: "0.9",
        min_lot_width: "25 ft",
        front_setback: "20 ft",
        side_setback: "3 ft",
        rear_setback: "28 ft"
      }
    },
    meta: {
      last_updated: "2023-07-15T00:00:00Z"
    }
  },
  message: "Fallback data provided due to API unavailability"
};

/**
 * Fetch zoning details for a location
 */
export async function fetchZoneDetails(params: {
  lat?: number;
  lng?: number;
  address?: string;
  output_fields?: string;
  group_plu?: string;
  replace_STF?: boolean;
}) {
  try {
    console.log("Fetching zoning details with params:", params);
    
    try {
      // Use the Supabase edge function to get zoning data
      const { data, error } = await supabase.functions.invoke('get-zoning', {
        body: params
      });
      
      if (error) {
        console.error("Supabase edge function error:", error);
        toast.warning("Using sample zoning data", {
          description: "Unable to connect to zoning database. Showing sample data instead."
        });
        return fallbackZoningData;
      }
      
      if (!data) {
        console.error("No data returned from zoning edge function");
        toast.warning("Using sample zoning data", {
          description: "Unable to retrieve zoning data. Showing sample data instead."
        });
        return fallbackZoningData;
      }
      
      console.log("Zoning API response:", data);
      return data;
    } catch (fetchError) {
      console.warn("Supabase edge function failed, using fallback data:", fetchError);
      toast.warning("Using sample zoning data", {
        description: "Unable to connect to zoning database. Showing sample data instead."
      });
      return fallbackZoningData;
    }
  } catch (error) {
    console.error("Error fetching zoning details:", error);
    toast.error("Failed to fetch zoning data", {
      description: "Using sample data instead."
    });
    return fallbackZoningData;
  }
}

// Mock data for fallback when the permits API is unavailable
const fallbackPermitData = {
  permits: [
    {
      id: "permit-1",
      record_id: "BLD-2023-12345",
      applicant: "Smith Construction Inc.",
      project_type: "Building",
      address: "Sample Address",
      postcode: "12345",
      city: "Sample City",
      state: "ST",
      project_brief: "New roof installation with additional insulation",
      project_name: "Residential Roof Replacement",
      status: "Approved",
      date: new Date().toISOString(),
      created_date: new Date().toISOString(),
      last_updated_date: new Date().toISOString(),
      applicant_contact: "John Smith",
      record_link: "#",
      contact_phone_number: "555-123-4567",
      contact_email: "info@example.com",
      source: "Sample Data",
      pin: {
        location: {
          lat: "40.7128",
          lon: "-74.0060"
        }
      },
      latitude: "40.7128",
      longitude: "-74.0060",
      // Adding missing required fields with default values
      department_id: "",
      zoning_classification_pre: "",
      zoning_classification_post: "",
      document_link: "",
      contact_website: "",
      parcel_number: "",
      block: "",
      lot: "",
      owner: "",
      authority: "",
      owner_address: "",
      owner_phone: "",
      comments: "",
      remarks: "",
      suburb: ""
    },
    {
      id: "permit-2",
      record_id: "PLM-2023-67890",
      applicant: "City Plumbing Co.",
      project_type: "Plumbing",
      address: "Sample Address",
      postcode: "12345",
      city: "Sample City",
      state: "ST",
      project_brief: "Replace water heater and update pipes to code",
      project_name: "Plumbing Update",
      status: "In Review",
      date: new Date().toISOString(),
      created_date: new Date().toISOString(),
      last_updated_date: new Date().toISOString(),
      applicant_contact: "Alice Jones",
      record_link: "#",
      contact_phone_number: "555-987-6543",
      contact_email: "service@example.com",
      source: "Sample Data",
      pin: {
        location: {
          lat: "40.7128",
          lon: "-74.0060"
        }
      },
      latitude: "40.7128",
      longitude: "-74.0060",
      // Adding missing required fields with default values
      department_id: "",
      zoning_classification_pre: "",
      zoning_classification_post: "",
      document_link: "",
      contact_website: "",
      parcel_number: "",
      block: "",
      lot: "",
      owner: "",
      authority: "",
      owner_address: "",
      owner_phone: "",
      comments: "",
      remarks: "",
      suburb: ""
    }
  ],
  total: 2
};

/**
 * Search for permits in a specified area
 */
export async function searchPermits(params: PermitSearchParams): Promise<PermitResponse> {
  try {
    console.log(`Fetching permits with coordinates: (${params.bottom_left_lat}, ${params.bottom_left_lng}) to (${params.top_right_lat}, ${params.top_right_lng})`);

    try {
      // Use the Supabase edge function to get permit data
      const { data, error } = await supabase.functions.invoke('get-permits', {
        body: params
      });
      
      if (error) {
        console.error("Supabase edge function error:", error);
        // Use fallback data but update it with the searched address
        if (params.exact_address) {
          const modifiedFallbackData = {
            ...fallbackPermitData,
            permits: fallbackPermitData.permits.map(permit => ({
              ...permit,
              address: params.exact_address
            }))
          };
          return modifiedFallbackData;
        }
        return fallbackPermitData;
      }
      
      if (!data) {
        console.error("No data returned from permits edge function");
        // Use fallback data but update it with the searched address
        if (params.exact_address) {
          const modifiedFallbackData = {
            ...fallbackPermitData,
            permits: fallbackPermitData.permits.map(permit => ({
              ...permit,
              address: params.exact_address
            }))
          };
          return modifiedFallbackData;
        }
        return fallbackPermitData;
      }
      
      return data as PermitResponse;
    } catch (fetchError) {
      console.warn("Supabase edge function failed, using fallback permit data:", fetchError);
      
      // Use fallback data but update it with the searched address
      if (params.exact_address) {
        const modifiedFallbackData = {
          ...fallbackPermitData,
          permits: fallbackPermitData.permits.map(permit => ({
            ...permit,
            address: params.exact_address
          }))
        };
        return modifiedFallbackData;
      }
      
      return fallbackPermitData;
    }
  } catch (error) {
    console.error("Error fetching permits:", error);
    toast.error("Failed to fetch permit data. Using sample data instead.");
    
    // Use fallback data
    if (params.exact_address) {
      const modifiedFallbackData = {
        ...fallbackPermitData,
        permits: fallbackPermitData.permits.map(permit => ({
          ...permit,
          address: params.exact_address
        }))
      };
      return modifiedFallbackData;
    }
    
    return fallbackPermitData;
  }
}

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
 * Helper function to check database connectivity to both public and salesforce schemas
 */
export const checkDatabaseConnection = async () => {
  try {
    // First check public schema access
    const publicCheck = await supabase
      .from('campuses')
      .select('count')
      .limit(1);
    
    if (publicCheck.error) {
      console.error("Public schema connectivity check failed:", publicCheck.error);
      return { connected: false, schemas: { public: false, salesforce: false }};
    }
    
    // Then check salesforce schema access
    let salesforceAccess = false;
    try {
      // Use an RPC function that attempts to access the salesforce schema
      const salesforceCheck = await supabase.rpc('test_salesforce_connection');
      salesforceAccess = !salesforceCheck.error && salesforceCheck.data?.salesforce_schema_access === true;
    } catch (schemaError) {
      console.error("Salesforce schema access check failed:", schemaError);
      // Continue even if this fails - we still have public schema access
    }
    
    // Return results
    return { 
      connected: true, 
      schemas: { 
        public: true, 
        salesforce: salesforceAccess 
      }
    };
  } catch (error) {
    console.error("Unexpected error during database connectivity check:", error);
    return { connected: false, schemas: { public: false, salesforce: false }};
  }
}; 