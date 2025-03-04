
import { toast } from "sonner";
import { API_BASE_URL, getApiKey } from "./api-config";

export async function fetchZoneDetails(params: {
  lat?: number;
  lng?: number;
  address?: string;
  output_fields?: string;
  group_plu?: string;
  replace_STF?: boolean;
}) {
  try {
    // Fetch the API key securely from Supabase
    const apiKey = await getApiKey('zoneomics');
    
    const queryParams = new URLSearchParams({
      api_key: apiKey,
    });

    if (params.lat && params.lng) {
      queryParams.append("lat", params.lat.toString());
      queryParams.append("lng", params.lng.toString());
    }

    if (params.address) {
      queryParams.append("address", params.address);
    }

    if (params.output_fields) {
      queryParams.append("output_fields", params.output_fields);
    }

    if (params.group_plu) {
      queryParams.append("group_plu", params.group_plu);
    }

    if (params.replace_STF !== undefined) {
      queryParams.append("replace_STF", params.replace_STF.toString());
    }

    console.log("Fetching zoning details with params:", queryParams.toString());
    const response = await fetch(`${API_BASE_URL}/zoneDetail?${queryParams}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch zoning details");
    }

    const data = await response.json();
    console.log("Zoning API response:", data);
    
    if (!data || typeof data.success !== 'boolean') {
      throw new Error("Invalid or incomplete response from zoning API");
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching zoning details:", error);
    toast.error("Failed to fetch zoning data. Please try again.");
    throw error;
  }
}
