
import { useState } from "react";
import { School, SchoolsResponse } from "@/types/schools";
import { SearchStatus } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useSchoolsData() {
  const [schools, setSchools] = useState<School[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [searchedAddress, setSearchedAddress] = useState<string>("");
  const [searchResponse, setSearchResponse] = useState<SchoolsResponse | null>(null);

  const fetchSchoolsData = async (params: { top_right_lat: number, top_right_lng: number }, address: string) => {
    setStatus("loading");
    console.log(`Fetching schools data for address: ${address}, coordinates: (${params.top_right_lat}, ${params.top_right_lng})`);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('nearby-schools', {
        body: { 
          address, 
          lat: params.top_right_lat, 
          lon: params.top_right_lng, 
          radius: 5 
        }
      });
      
      if (error) {
        console.error("Error calling nearby-schools function:", error);
        setStatus("error");
        setSchools([]);
        setSearchResponse(null);
        toast.error("Error retrieving schools data", {
          description: `${error.message || "We couldn't connect to the schools database."}`
        });
        return;
      }
      
      if (!response || !response.schools) {
        console.error("No schools data returned for address:", address);
        setStatus("error");
        setSchools([]);
        setSearchResponse(null);
        toast.error("Schools data not available", {
          description: "We couldn't find school data for this location."
        });
        return;
      }
      
      console.log(`Received ${response.schools.length} schools for ${address}`);
      setSchools(response.schools);
      setSearchResponse(response as SchoolsResponse);
      setStatus("success");
      setSearchedAddress(response.searchedAddress || address);
      
      if (response.schools.length === 0) {
        toast.info("No schools found", {
          description: `No schools found within ${response.radiusMiles} miles of this location.`
        });
      } else {
        toast.success("Schools data retrieved", {
          description: `Found ${response.schools.length} schools within ${response.radiusMiles} miles.`
        });
      }
    } catch (error) {
      console.error("Error in useSchoolsData:", error);
      setStatus("error");
      setSchools([]);
      setSearchResponse(null);
      toast.error("Error retrieving schools data", {
        description: "There was a problem connecting to the schools database. Please try again later."
      });
    }
  };

  const reset = () => {
    setSchools([]);
    setStatus("idle");
    setSearchedAddress("");
    setSearchResponse(null);
  };

  return {
    schools,
    searchResponse,
    status,
    searchedAddress,
    fetchSchoolsData,
    reset
  };
}
