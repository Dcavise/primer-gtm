import { PermitResponse, PermitSearchParams } from "@/types";
import { toast } from "sonner";
import { API_BASE_URL, getApiKey } from "./api-config";

export async function searchPermits(params: PermitSearchParams): Promise<PermitResponse> {
  try {
    // Fetch the API key securely from Supabase
    const apiKey = await getApiKey('zoneomics');
    
    const queryParams = new URLSearchParams({
      api_key: apiKey,
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

export async function testMiamiAddress(): Promise<PermitResponse | null> {
  try {
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

export async function testExactAddressMatch(): Promise<{permits: PermitResponse | null, address: string}> {
  const exactMatchAddress = "1601 Washington Ave, Miami Beach, FL 33139";
  
  try {
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
    
    const exactMatches = result.permits.filter(permit => {
      return permit.address && 
             permit.address.toLowerCase().includes("1601") &&
             permit.address.toLowerCase().includes("washington");
    });
    
    console.log(`Found ${exactMatches.length} exact matches for the test address`);
    
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
