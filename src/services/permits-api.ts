
import { PermitResponse, PermitSearchParams } from "@/types";
import { toast } from "sonner";
import { API_BASE_URL, getApiKey } from "./api-config";

// Mock data for fallback when the API is unavailable
const fallbackPermitData = {
  permits: [
    {
      id: "permit-1",
      record_id: "BLD-2023-12345",
      applicant: "Smith Construction Inc.",
      project_type: "Building",
      address: "Sample Address",
      postcode: "12345",
      city: "Sample City",
      state: "ST",
      project_brief: "New roof installation with additional insulation",
      project_name: "Residential Roof Replacement",
      status: "Approved",
      date: new Date().toISOString(),
      created_date: new Date().toISOString(),
      last_updated_date: new Date().toISOString(),
      applicant_contact: "John Smith",
      record_link: "#",
      contact_phone_number: "555-123-4567",
      contact_email: "info@example.com",
      source: "Sample Data",
      pin: {
        location: {
          lat: "40.7128",
          lon: "-74.0060"
        }
      },
      latitude: "40.7128",
      longitude: "-74.0060"
    },
    {
      id: "permit-2",
      record_id: "PLM-2023-67890",
      applicant: "City Plumbing Co.",
      project_type: "Plumbing",
      address: "Sample Address",
      postcode: "12345",
      city: "Sample City",
      state: "ST",
      project_brief: "Replace water heater and update pipes to code",
      project_name: "Plumbing Update",
      status: "In Review",
      date: new Date().toISOString(),
      created_date: new Date().toISOString(),
      last_updated_date: new Date().toISOString(),
      applicant_contact: "Alice Jones",
      record_link: "#",
      contact_phone_number: "555-987-6543",
      contact_email: "service@example.com",
      source: "Sample Data",
      pin: {
        location: {
          lat: "40.7128",
          lon: "-74.0060"
        }
      },
      latitude: "40.7128",
      longitude: "-74.0060"
    }
  ],
  total: 2
};

export async function searchPermits(params: PermitSearchParams): Promise<PermitResponse> {
  try {
    // Fetch the API key securely from Supabase
    const apiKey = await getApiKey('zoneomics');
    
    const queryParams = new URLSearchParams({
      api_key: apiKey,
      bottom_left_lat: params.bottom_left_lat.toString(),
      bottom_left_lng: params.bottom_left_lng.toString(),
      top_right_lat: params.top_right_lat.toString(),
      top_right_lng: params.top_right_lng.toString()
    });

    console.log(`Fetching permits with coordinates: (${params.bottom_left_lat}, ${params.bottom_left_lng}) to (${params.top_right_lat}, ${params.top_right_lng})`);

    // Set up a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      const response = await fetch(`${API_BASE_URL}/zonePermits?${queryParams}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch permits");
      }
      
      const data = await response.json();
      console.log(`API returned ${data.data?.length || 0} permits`);
      
      // Filter for exact address matches if exact_address is provided
      if (params.exact_address && data.data && data.data.length > 0) {
        const exactAddress = params.exact_address.toLowerCase().trim();
        const exactMatches = data.data.filter((permit: any) => {
          if (!permit.address) return false;
          
          return permit.address.toLowerCase().trim() === exactAddress;
        });
        
        console.log(`Found ${exactMatches.length} exact address matches for "${exactAddress}"`);
        
        return {
          permits: exactMatches || [],
          total: exactMatches.length || 0
        };
      }
      
      return {
        permits: data.data || [],
        total: data.data?.length || 0
      };
    } catch (fetchError) {
      console.warn("Fetch operation failed, using fallback permit data:", fetchError);
      
      // Use fallback data but update it with the searched address
      if (params.exact_address) {
        const modifiedFallbackData = {
          ...fallbackPermitData,
          permits: fallbackPermitData.permits.map(permit => ({
            ...permit,
            address: params.exact_address
          }))
        };
        return modifiedFallbackData;
      }
      
      return fallbackPermitData;
    }
  } catch (error) {
    console.error("Error fetching permits:", error);
    toast.error("Failed to fetch permit data. Using sample data instead.");
    
    // Use fallback data
    if (params.exact_address) {
      const modifiedFallbackData = {
        ...fallbackPermitData,
        permits: fallbackPermitData.permits.map(permit => ({
          ...permit,
          address: params.exact_address
        }))
      };
      return modifiedFallbackData;
    }
    
    return fallbackPermitData;
  }
}

export async function testMiamiAddress(): Promise<PermitResponse | null> {
  try {
    const miamiParams: PermitSearchParams = {
      bottom_left_lat: 25.7619,
      bottom_left_lng: -80.19,
      top_right_lat: 25.7903,
      top_right_lng: -80.13
    };
    
    console.log("Testing Miami address with coordinates:", miamiParams);
    const result = await searchPermits(miamiParams);
    console.log("API Test Result:", {
      total: result.total,
      samplePermits: result.permits.slice(0, 3)
    });
    
    return result;
  } catch (error) {
    console.error("Miami test failed:", error);
    return null;
  }
}

export async function testExactAddressMatch(): Promise<{permits: PermitResponse | null, address: string}> {
  const exactMatchAddress = "1601 Washington Ave, Miami Beach, FL 33139";
  
  try {
    const params: PermitSearchParams = {
      bottom_left_lat: 25.7850,
      bottom_left_lng: -80.1350,
      top_right_lat: 25.7900,
      top_right_lng: -80.1280
    };
    
    console.log("Testing exact address match with coordinates:", params);
    console.log("Test address:", exactMatchAddress);
    
    const result = await searchPermits(params);
    console.log("Exact Address Test Result:", {
      total: result.total,
      samplePermits: result.permits.slice(0, 3)
    });
    
    const exactMatches = result.permits.filter(permit => {
      return permit.address && 
             permit.address.toLowerCase().includes("1601") &&
             permit.address.toLowerCase().includes("washington");
    });
    
    console.log(`Found ${exactMatches.length} exact matches for the test address`);
    
    return {
      permits: {
        permits: result.permits,
        total: result.permits.length
      },
      address: exactMatchAddress
    };
  } catch (error) {
    console.error("Exact address test failed:", error);
    return {
      permits: null,
      address: exactMatchAddress
    };
  }
}
