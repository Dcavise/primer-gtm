
import { useState } from "react";
import { SearchStatus } from "@/types";
import { toast } from "sonner";
import { fetchZoneDetails } from "@/services/api";

export interface ZoningData {
  id: string;
  zone_name: string;
  zone_code: string;
  zone_type: string;
  zone_sub_type?: string;
  zone_guide?: string;
  permitted_uses: string[];
  conditional_uses?: string[];
  prohibited_uses?: string[];
  description: string;
  last_updated?: string;
  link?: string;
  controls?: {
    standard?: Record<string, any>;
    "non-standard"?: Record<string, any>;
  };
}

export function useZoningData() {
  const [zoningData, setZoningData] = useState<ZoningData[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [searchedAddress, setSearchedAddress] = useState<string>("");

  const fetchZoningData = async (params: any, address: string) => {
    setStatus("loading");
    
    try {
      // Extract the coordinates from the search params
      const latitude = (params.top_right_lat + params.bottom_left_lat) / 2;
      const longitude = (params.top_right_lng + params.bottom_left_lng) / 2;
      
      // Call the zoneDetail API with the point coordinates
      const zoneDetail = await fetchZoneDetails({
        lat: latitude,
        lng: longitude,
        output_fields: "plu,controls"
      });
      
      if (!zoneDetail || !zoneDetail.data) {
        throw new Error("No zoning data found for this location");
      }
      
      // Transform the API response to our ZoningData format
      const formattedData: ZoningData[] = [{
        id: `zone-${Date.now()}`,
        zone_name: zoneDetail.data.zone_name || "Unknown Zone",
        zone_code: zoneDetail.data.zone_code || "N/A",
        zone_type: zoneDetail.data.zone_type || "Unknown",
        zone_sub_type: zoneDetail.data.zone_sub_type,
        zone_guide: zoneDetail.data.zone_guide,
        permitted_uses: zoneDetail.data.as_of_right || [],
        conditional_uses: zoneDetail.data.conditional_uses || [],
        prohibited_uses: zoneDetail.data.prohibited || [],
        description: zoneDetail.data.zone_guide || "No description available",
        last_updated: zoneDetail.data.last_updated,
        link: zoneDetail.data.link,
        controls: zoneDetail.data.controls
      }];
      
      setZoningData(formattedData);
      setSearchedAddress(address);
      setStatus("success");
      
      toast.success("Zoning data retrieved", {
        description: "Showing zoning information for the specified location."
      });
    } catch (error) {
      console.error("Error in useZoningData:", error);
      setStatus("error");
      setZoningData([]);
      toast.error("Error retrieving zoning data", {
        description: "There was a problem connecting to the zoning database. Please try again later."
      });
    }
  };

  const reset = () => {
    setZoningData([]);
    setStatus("idle");
    setSearchedAddress("");
  };

  return {
    zoningData,
    status,
    searchedAddress,
    fetchZoningData,
    reset
  };
}
