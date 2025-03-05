import { toast } from "sonner";
import { SUPABASE_URL } from "@/services/api-config";
import { supabase } from "@/integrations/supabase/client";

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
    
    // Make API request to our supabase function
    console.log(`Using Supabase edge function to geocode address`);
    
    const { data, error } = await supabase.functions.invoke('geocode-address', {
      body: { address }
    });
    
    if (error) {
      console.error(`Geocoding edge function error:`, error);
      toast.error("Geocoding failed", {
        description: error.message || "Could not find coordinates for the provided address."
      });
      return null;
    }
    
    if (!data || !data.coordinates) {
      console.error("Invalid geocoding result structure:", data);
      toast.error("Address location error", {
        description: "The system couldn't determine exact coordinates for this address."
      });
      return null;
    }
    
    console.log(`Successfully geocoded address to: ${data.formattedAddress} (${data.coordinates.lat}, ${data.coordinates.lng})`);
    
    return {
      address: data.formattedAddress || address,
      coordinates: {
        lat: data.coordinates.lat,
        lng: data.coordinates.lng
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
