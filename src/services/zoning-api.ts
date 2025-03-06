
import { toast } from "sonner";
import { SUPABASE_URL } from "./api-config";
import { supabase } from '@/integrations/supabase-client';

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
