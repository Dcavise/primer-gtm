
import { useState } from "react";
import { SearchStatus, Permit } from "@/types";
import { ZoningData } from "@/hooks/use-zoning-data";
import { CensusData } from "@/types";
import { School } from "@/types/schools";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PropertySummaryResponse {
  summary: string;
  timestamp: string;
}

export function usePropertySummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [searchedAddress, setSearchedAddress] = useState<string>("");

  const generateSummary = async (
    address: string,
    permits: Permit[],
    zoningData: ZoningData[],
    censusData: CensusData | null,
    schools: School[]
  ) => {
    // Reset the summary state when generating a new summary
    setStatus("loading");
    setSummary(null);
    setSearchedAddress(address);
    
    console.log("Generating property summary for:", address);
    console.log("Data available for summary:", {
      permits: permits?.length || 0,
      zoningData: zoningData?.length || 0,
      censusData: censusData ? "Yes" : "No",
      schools: schools?.length || 0
    });
    
    // Log the actual zoning data being passed to ensure it's current
    if (zoningData && zoningData.length > 0) {
      console.log("Current zoning data being used for summary:", {
        zone_code: zoningData[0].zone_code,
        zone_name: zoningData[0].zone_name,
        zone_type: zoningData[0].zone_type
      });
    }
    
    try {
      // Check for minimum required data
      if (!address) {
        throw new Error("No address provided for summary generation");
      }
      
      const { data, error } = await supabase.functions.invoke('generate-property-summary', {
        body: { 
          permitData: permits || [],
          zoningData: zoningData || [],
          censusData: censusData || null,
          schoolsData: schools || [],
          address: address
        }
      });
      
      if (error) {
        console.error("Error generating property summary:", error);
        setStatus("error");
        toast.error("Error generating property summary", {
          description: "We couldn't generate a summary for this property."
        });
        return;
      }
      
      if (!data || !data.summary) {
        console.error("No summary data returned");
        setStatus("error");
        toast.error("Summary generation failed", {
          description: "We couldn't generate a summary for this property."
        });
        return;
      }
      
      console.log("Property summary generated successfully for:", address);
      setSummary(data.summary);
      setSearchedAddress(address);
      setStatus("success");
      
      toast.success("Property summary generated", {
        description: "We've created an AI summary of all the property data."
      });
    } catch (error) {
      console.error("Error in usePropertySummary:", error);
      setStatus("error");
      setSummary(null);
      toast.error("Error generating property summary", {
        description: "There was a problem generating the property summary. Please try again."
      });
    }
  };

  const reset = () => {
    setSummary(null);
    setStatus("idle");
    setSearchedAddress("");
  };

  return {
    summary,
    status,
    searchedAddress,
    generateSummary,
    reset
  };
}
