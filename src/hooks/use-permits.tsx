
import { useState } from "react";
import { Permit, PermitResponse, PermitSearchParams, SearchStatus } from "@/types";
import { searchPermits } from "@/services/api";
import { toast } from "sonner";

export function usePermits() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [searchedAddress, setSearchedAddress] = useState<string>("");

  const fetchPermits = async (params: PermitSearchParams, address: string) => {
    setStatus("loading");
    
    try {
      const response = await searchPermits(params);
      setPermits(response.permits);
      setSearchedAddress(address);
      setStatus("success");
      
      if (response.permits.length === 0) {
        toast.info("No permits found for this location.", {
          description: "The address was found, but there are no permits in our database for this precise location or nearby area."
        });
      } else {
        toast.success(`Found ${response.permits.length} permits`, {
          description: "Showing permit results for the specified location and nearby area."
        });
      }
    } catch (error) {
      console.error("Error in usePermits:", error);
      setStatus("error");
      setPermits([]);
      toast.error("Error retrieving permit data", {
        description: "There was a problem connecting to the permit database. Please try again later."
      });
    }
  };

  const reset = () => {
    setPermits([]);
    setStatus("idle");
    setSearchedAddress("");
  };

  return {
    permits,
    status,
    searchedAddress,
    fetchPermits,
    reset
  };
}
