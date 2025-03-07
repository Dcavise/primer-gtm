import { useState, useEffect } from "react";
import { Permit, PermitResponse, PermitSearchParams, SearchStatus } from "@/types";
import { searchPermits } from "@/lib/serverComms";
import { toast } from "sonner";
import { useDeveloperMode } from '@/contexts/DeveloperModeContext';
import { mockPermits } from '@/utils/mockData';

export function usePermits() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [searchedAddress, setSearchedAddress] = useState<string>("");
  const [isUsingFallbackData, setIsUsingFallbackData] = useState<boolean>(false);
  const { isDeveloperMode } = useDeveloperMode();

  // Listen for developer mode changes
  useEffect(() => {
    const handleDevModeChange = () => {
      // Reset data when developer mode changes
      reset();
    };
    
    window.addEventListener('developer-mode-changed', handleDevModeChange);
    return () => window.removeEventListener('developer-mode-changed', handleDevModeChange);
  }, []);

  const fetchPermits = async (params: PermitSearchParams, address: string) => {
    setStatus("loading");
    setIsUsingFallbackData(false);
    console.log(`Fetching permits for address: ${address}`);
    
    // Use mock data in developer mode
    if (isDeveloperMode) {
      console.log("[DEV MODE] Using mock permits data");
      
      // Reset the permits when searching for a new address
      setPermits([]);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Map mock permits to the Permit type
      const mockPermitsData = mockPermits.map(permit => ({
        id: permit.id,
        permit_number: permit.permitNumber,
        type: permit.type,
        status: permit.status,
        date: new Date().toISOString(),
        issued_date: permit.issuedDate ? new Date(permit.issuedDate).toISOString() : null,
        expiration_date: permit.expirationDate ? new Date(permit.expirationDate).toISOString() : null,
        description: permit.description,
        applicant: permit.applicant,
        address: permit.address,
        valuation: permit.valuation,
        details: permit.details || [],
        square_footage: permit.squareFootage,
        source: "Mock Data"
      })) as Permit[];
      
      setPermits(mockPermitsData);
      setSearchedAddress(address);
      setStatus("success");
      setIsUsingFallbackData(false);
      
      toast.success(`Found ${mockPermitsData.length} permits (MOCK)`, {
        description: "Showing mock permit data for development."
      });
      
      return;
    }
    
    // Real data fetching for non-developer mode
    try {
      // Reset the permits when searching for a new address
      setPermits([]);
      
      const response = await searchPermits(params);
      
      // Determine if we're using fallback data based on the source property
      const usingFallback = response.permits.some(permit => permit.source === "Sample Data");
      setIsUsingFallbackData(usingFallback);
      
      // Process permits to ensure all have properly formatted dates
      const processedPermits = response.permits.map(permit => ({
        ...permit,
        // Ensure date exists and is valid
        date: permit.date || permit.created_date || permit.last_updated_date || new Date().toISOString()
      }));
      
      console.log(`Found ${processedPermits.length} permits for address: ${address}`);
      
      setPermits(processedPermits);
      setSearchedAddress(address);
      setStatus("success");
      
      if (processedPermits.length === 0) {
        toast.info("No permits found for this address.", {
          description: "We couldn't find any permits that match this exact address in our database."
        });
      } else if (usingFallback) {
        toast.warning("Using sample permit data", {
          description: "Unable to connect to the permit database. Showing sample data instead."
        });
      } else {
        toast.success(`Found ${processedPermits.length} permits`, {
          description: "Showing permit results for this exact address."
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
    setIsUsingFallbackData(false);
  };

  return {
    permits,
    status,
    searchedAddress,
    isUsingFallbackData,
    fetchPermits,
    reset
  };
}
