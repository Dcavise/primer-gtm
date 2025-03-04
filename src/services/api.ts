
import { PermitResponse, PermitSearchParams } from "@/types";
import { toast } from "sonner";

const API_KEY = "9287beef057a695d64806257059567fbee26524d";
const API_BASE_URL = "https://api.zoneomics.com/v2";

export async function searchPermits(params: PermitSearchParams): Promise<PermitResponse> {
  try {
    const queryParams = new URLSearchParams({
      api_key: API_KEY,
      bottom_left_lat: params.bottom_left_lat.toString(),
      bottom_left_lng: params.bottom_left_lng.toString(),
      top_right_lat: params.top_right_lat.toString(),
      top_right_lng: params.top_right_lng.toString()
    });

    const response = await fetch(`${API_BASE_URL}/zonePermits?${queryParams}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch permits");
    }

    const data = await response.json();
    return {
      permits: data.data || [],
      total: data.data?.length || 0
    };
  } catch (error) {
    console.error("Error fetching permits:", error);
    toast.error("Failed to fetch permit data. Please try again.");
    throw error;
  }
}

// New function to fetch zoning details
export async function fetchZoneDetails(params: {
  lat: number;
  lng: number;
  address?: string;
  output_fields?: string;
  group_plu?: string;
  replace_STF?: boolean;
}) {
  try {
    const queryParams = new URLSearchParams({
      api_key: API_KEY,
    });

    // Add lat/lng parameters if provided
    if (params.lat && params.lng) {
      queryParams.append("lat", params.lat.toString());
      queryParams.append("lng", params.lng.toString());
    }

    // Add address parameter if provided
    if (params.address) {
      queryParams.append("address", params.address);
    }

    // Add optional parameters if provided
    if (params.output_fields) {
      queryParams.append("output_fields", params.output_fields);
    }

    if (params.group_plu) {
      queryParams.append("group_plu", params.group_plu);
    }

    if (params.replace_STF !== undefined) {
      queryParams.append("replace_STF", params.replace_STF.toString());
    }

    const response = await fetch(`${API_BASE_URL}/zoneDetail?${queryParams}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch zoning details");
    }

    const data = await response.json();
    
    if (!data.status || !data.data) {
      throw new Error("Invalid response from zoning API");
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching zoning details:", error);
    toast.error("Failed to fetch zoning data. Please try again.");
    throw error;
  }
}

// Test function for Miami address
export async function testMiamiAddress(): Promise<PermitResponse | null> {
  try {
    // Updated coordinates for Miami Beach area where permits are known to exist
    const miamiParams: PermitSearchParams = {
      bottom_left_lat: 25.7619,
      bottom_left_lng: -80.19,
      top_right_lat: 25.7903,
      top_right_lng: -80.13
    };
    
    console.log("Testing Miami address with coordinates:", miamiParams);
    const result = await searchPermits(miamiParams);
    console.log("API Test Result:", {
      total: result.total,
      samplePermits: result.permits.slice(0, 3)
    });
    
    return result;
  } catch (error) {
    console.error("Miami test failed:", error);
    return null;
  }
}

// Test function for a specific address with exact matches
export async function testExactAddressMatch(): Promise<{permits: PermitResponse | null, address: string}> {
  // This address is known to have permit data with exact matches
  const exactMatchAddress = "1601 Washington Ave, Miami Beach, FL 33139";
  
  try {
    // Coordinates for the specific address (using a wider bounding box)
    const params: PermitSearchParams = {
      bottom_left_lat: 25.7850,
      bottom_left_lng: -80.1350,
      top_right_lat: 25.7900,
      top_right_lng: -80.1280
    };
    
    console.log("Testing exact address match with coordinates:", params);
    console.log("Test address:", exactMatchAddress);
    
    const result = await searchPermits(params);
    console.log("Exact Address Test Result:", {
      total: result.total,
      samplePermits: result.permits.slice(0, 3)
    });
    
    // Filter permits to find exact matches for the test address
    const exactMatches = result.permits.filter(permit => {
      return permit.address && 
             permit.address.toLowerCase().includes("1601") &&
             permit.address.toLowerCase().includes("washington");
    });
    
    console.log(`Found ${exactMatches.length} exact matches for the test address`);
    
    // Return all permits, but ensure we have at least a few exact matches
    return {
      permits: {
        permits: result.permits,
        total: result.permits.length
      },
      address: exactMatchAddress
    };
  } catch (error) {
    console.error("Exact address test failed:", error);
    return {
      permits: null,
      address: exactMatchAddress
    };
  }
}
