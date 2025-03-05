
import { toast } from "sonner";
import { SUPABASE_URL } from "@/services/api-config";

// Define coordinate type
export interface Coordinates {
  lat: number;
  lng: number;
}

// Function to geocode an address using Google Maps API via Supabase function
export const geocodeAddress = async (address: string): Promise<{ 
  address: string;
  coordinates: Coordinates;
} | null> => {
  try {
    console.log(`Geocoding address: ${address}`);
    
    // Improved error handling and logging
    if (!address || address.trim() === '') {
      toast.error("Invalid address", {
        description: "Please provide a valid address to search."
      });
      return null;
    }
    
    // Make API request to our supabase function that wraps Google Maps API
    console.log(`Making request to ${SUPABASE_URL}/functions/v1/geocode-address`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/geocode-address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ address }),
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Geocoding API error: Status ${response.status}, Response: ${errorText}`);
      throw new Error(`Geocoding API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Geocoding API response:", result);
    
    if (!result || !result.coordinates) {
      console.error("Invalid geocoding result structure:", result);
      throw new Error("No coordinates found for this address");
    }
    
    console.log(`Successfully geocoded address to: ${result.formattedAddress} (${result.coordinates.lat}, ${result.coordinates.lng})`);
    
    return {
      address: result.formattedAddress || address,
      coordinates: {
        lat: result.coordinates.lat,
        lng: result.coordinates.lng
      }
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    toast.error("Geocoding failed", {
      description: "Could not find coordinates for the provided address. Please check the address and try again."
    });
    return null;
  }
};

// Create a bounding box around a point with a specified radius
export const createBoundingBox = (
  center: Coordinates,
  radiusInMeters: number
): {
  bottomLeft: Coordinates;
  topRight: Coordinates;
} => {
  // Earth's radius in meters
  const earthRadius = 6378137;
  
  // Convert radius from meters to degrees
  const radiusInDegrees = radiusInMeters / earthRadius * (180 / Math.PI);
  
  // Calculate the bounding box
  return {
    bottomLeft: {
      lat: center.lat - radiusInDegrees,
      lng: center.lng - radiusInDegrees / Math.cos(center.lat * Math.PI / 180)
    },
    topRight: {
      lat: center.lat + radiusInDegrees,
      lng: center.lng + radiusInDegrees / Math.cos(center.lat * Math.PI / 180)
    }
  };
};
