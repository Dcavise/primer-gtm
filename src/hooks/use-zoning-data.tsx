
import { useState } from "react";
import { SearchStatus } from "@/types";
import { toast } from "sonner";
import { fetchZoneDetails } from "@/services/zoning-api";

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
  const [status, setStatus] = useState<SearchStatus>(SearchStatus.IDLE);
  const [searchedAddress, setSearchedAddress] = useState<string>("");

  const fetchZoningData = async (address: string) => {
    setStatus(SearchStatus.LOADING);
    
    try {
      console.log("Fetching zoning data for address:", address);
      
      // Call the zoneDetail API with the address directly
      const zoneDetail = await fetchZoneDetails({
        address: address,
        output_fields: "plu,controls",
        replace_STF: true
      });
      
      if (!zoneDetail || !zoneDetail.data) {
        throw new Error("No zoning data found for this location");
      }
      
      // Get the proper data structure from the response
      const zoneData = zoneDetail.data.zone_details || zoneDetail.data;
      const pluData = zoneDetail.data.permitted_land_uses || {};
      const controlsData = zoneDetail.data.controls || {};
      
      console.log("Processed zoning data:", { zoneData, pluData, controlsData });
      
      // Transform the API response to our ZoningData format
      const formattedData: ZoningData[] = [{
        id: `zone-${Date.now()}`,
        zone_name: zoneData.zone_name || "Unknown Zone",
        zone_code: zoneData.zone_code || "N/A",
        zone_type: zoneData.zone_type || "Unknown",
        zone_sub_type: zoneData.zone_sub_type,
        zone_guide: zoneData.zone_guide,
        permitted_uses: pluData.as_of_right || [],
        conditional_uses: pluData.conditional_uses || [],
        prohibited_uses: pluData.prohibited || [],
        description: zoneData.zone_guide || "No description available",
        last_updated: zoneDetail.data.meta?.last_updated,
        link: zoneData.link,
        controls: controlsData
      }];
      
      setZoningData(formattedData);
      setSearchedAddress(address);
      setStatus(SearchStatus.SUCCESS);
      
      toast.success("Zoning data retrieved", {
        description: "Showing zoning information for the specified location."
      });
    } catch (error) {
      console.error("Error in useZoningData:", error);
      setStatus(SearchStatus.ERROR);
      setZoningData([]);
      toast.error("Error retrieving zoning data", {
        description: "There was a problem connecting to the zoning database. Please try again later."
      });
    }
  };

  const reset = () => {
    setZoningData([]);
    setStatus(SearchStatus.IDLE);
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
