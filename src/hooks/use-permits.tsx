
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
          description: "Try adjusting your search or try a different address."
        });
      } else {
        toast.success(`Found ${response.permits.length} permits`, {
          description: "Showing permit results for the specified location."
        });
      }
    } catch (error) {
      console.error("Error in usePermits:", error);
      setStatus("error");
      setPermits([]);
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
