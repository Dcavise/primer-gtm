
import { toast } from "sonner";
import { API_BASE_URL, getApiKey } from "./api-config";

// Mock data for fallback when the API is unavailable
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
    
    try {
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(`${API_BASE_URL}/zoneDetail?${queryParams}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
    } catch (fetchError) {
      console.warn("Fetch operation failed, using fallback data:", fetchError);
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
