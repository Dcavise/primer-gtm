
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
