
import { useState } from "react";
import { SearchStatus } from "@/types";
import { toast } from "sonner";

export interface ZoningData {
  id: string;
  zone_name: string;
  zone_type: string;
  permitted_uses: string[];
  description: string;
  date_updated: string;
}

export function useZoningData() {
  const [zoningData, setZoningData] = useState<ZoningData[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [searchedAddress, setSearchedAddress] = useState<string>("");

  const fetchZoningData = async (params: any, address: string) => {
    setStatus("loading");
    
    try {
      // Simulating API call with mock data for now
      // In a real implementation, you would call an actual zoning API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockData: ZoningData[] = [
        {
          id: "zn-1",
          zone_name: "R-1",
          zone_type: "Residential",
          permitted_uses: ["Single-family homes", "Parks", "Community facilities"],
          description: "Low-density single-family residential district",
          date_updated: "2023-05-15"
        },
        {
          id: "zn-2",
          zone_name: "C-1",
          zone_type: "Commercial",
          permitted_uses: ["Retail", "Offices", "Restaurants"],
          description: "Neighborhood commercial district intended for small-scale retail and services",
          date_updated: "2023-06-22"
        },
        {
          id: "zn-3",
          zone_name: "M-1",
          zone_type: "Industrial",
          permitted_uses: ["Manufacturing", "Warehousing", "Distribution"],
          description: "Light manufacturing district with some commercial uses permitted",
          date_updated: "2023-04-10"
        }
      ];
      
      setZoningData(mockData);
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
