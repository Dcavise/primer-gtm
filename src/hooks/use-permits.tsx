
import { useState } from "react";
import { Permit, PermitResponse, PermitSearchParams, SearchStatus } from "@/types";
import { searchPermits } from "@/services/permits-api";
import { toast } from "sonner";

export function usePermits() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [status, setStatus] = useState<SearchStatus>(SearchStatus.IDLE);
  const [searchedAddress, setSearchedAddress] = useState<string>("");

  const fetchPermits = async (params: PermitSearchParams, address: string) => {
    setStatus(SearchStatus.LOADING);
    console.log(`Fetching permits for address: ${address}`);
    
    try {
      // Reset the permits when searching for a new address
      setPermits([]);
      
      const response = await searchPermits(params);
      
      // Process permits to ensure all have properly formatted dates
      const processedPermits = response.permits.map(permit => ({
        ...permit,
        // Ensure date exists and is valid
        date: permit.date || permit.created_date || permit.last_updated_date || new Date().toISOString()
      }));
      
      console.log(`Found ${processedPermits.length} permits for address: ${address}`);
      
      setPermits(processedPermits);
      setSearchedAddress(address);
      setStatus(SearchStatus.SUCCESS);
      
      if (processedPermits.length === 0) {
        toast.info("No permits found for this address.", {
          description: "We couldn't find any permits that match this exact address in our database."
        });
      } else {
        toast.success(`Found ${processedPermits.length} permits`, {
          description: "Showing permit results for this exact address."
        });
      }
    } catch (error) {
      console.error("Error in usePermits:", error);
      setStatus(SearchStatus.ERROR);
      setPermits([]);
      toast.error("Error retrieving permit data", {
        description: "There was a problem connecting to the permit database. Please try again later."
      });
    }
  };

  const reset = () => {
    setPermits([]);
    setStatus(SearchStatus.IDLE);
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
